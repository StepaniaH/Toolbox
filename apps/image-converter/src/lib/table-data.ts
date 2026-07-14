import { openZip, type OpenedZip, type ZipEntry } from "./zip-reader";
import { createZip } from "./zip";

export type TableSourceFormat = "csv" | "tsv" | "xlsx";
export type TableDocument = {
  format: TableSourceFormat;
  rows: string[][];
  delimiter?: "," | "\t" | ";";
  sheetNames: string[];
  sheetIndex: number;
  formulaCount: number;
};

export const MAX_TABLE_FILE_BYTES = 32 * 1024 * 1024;
export const MAX_DELIMITED_FILE_BYTES = 16 * 1024 * 1024;
export const MAX_TABLE_ROWS = 20_000;
export const MAX_TABLE_COLUMNS = 256;
export const MAX_TABLE_CELLS = 250_000;
export const MAX_TABLE_CELL_CHARS = 32_767;

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XML_LIMITS = {
  "xl/workbook.xml": 1024 * 1024,
  "xl/_rels/workbook.xml.rels": 1024 * 1024,
  "xl/sharedStrings.xml": 16 * 1024 * 1024,
} as const;

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function tableSourceFormat(name: string): TableSourceFormat | null {
  const extension = extensionOf(name);
  if (extension === "csv") return "csv";
  if (extension === "tsv") return "tsv";
  if (extension === "xlsx") return "xlsx";
  return null;
}

function ensureCellBudget(rows: number, columns: number, cells: number): void {
  if (rows > MAX_TABLE_ROWS) throw new Error("table-row-limit");
  if (columns > MAX_TABLE_COLUMNS) throw new Error("table-column-limit");
  if (cells > MAX_TABLE_CELLS) throw new Error("table-cell-limit");
}

function delimiterScore(text: string, delimiter: "," | "\t" | ";"): number {
  const widths: number[] = [];
  let quoted = false;
  let width = 1;
  for (let index = 0; index < text.length && widths.length < 20; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && character === delimiter) width += 1;
    else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      if (width > 1) widths.push(width);
      width = 1;
    }
  }
  if (width > 1) widths.push(width);
  if (!widths.length) return 0;
  const counts = new Map<number, number>();
  for (const value of widths) counts.set(value, (counts.get(value) ?? 0) + 1);
  const [commonWidth, occurrences] = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  return commonWidth * occurrences;
}

export function detectDelimiter(text: string): "," | "\t" | ";" {
  const candidates = [",", "\t", ";"] as const;
  return candidates.map((delimiter) => ({ delimiter, score: delimiterScore(text, delimiter) }))
    .sort((left, right) => right.score - left.score)[0].delimiter;
}

export function parseDelimited(text: string, delimiter = detectDelimiter(text)): TableDocument {
  const source = text.replace(/^\uFEFF/, "");
  if (source.includes("\0")) throw new Error("table-invalid-text");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let cellCount = 0;
  const pushCell = () => {
    if (cell.length > MAX_TABLE_CELL_CHARS) throw new Error("table-cell-size");
    row.push(cell);
    cell = "";
    cellCount += 1;
    ensureCellBudget(rows.length + 1, row.length, cellCount);
  };
  const pushRow = () => {
    pushCell();
    rows.push(row);
    row = [];
    ensureCellBudget(rows.length, 0, cellCount);
  };
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') { cell += '"'; index += 1; }
        else quoted = false;
      } else cell += character;
      continue;
    }
    if (character === '"' && cell.length === 0) quoted = true;
    else if (character === delimiter) pushCell();
    else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      pushRow();
    } else cell += character;
  }
  if (quoted) throw new Error("table-invalid-csv");
  if (cell.length || row.length || !rows.length) pushRow();
  if (rows.length > 1 && rows.at(-1)?.every((value) => value === "") && /(?:\r\n|\r|\n)$/.test(source)) rows.pop();
  return { format: delimiter === "\t" ? "tsv" : "csv", rows, delimiter, sheetNames: [], sheetIndex: 0, formulaCount: 0 };
}

function protectFormula(value: string): string {
  const candidate = value.trimStart();
  if (!candidate || !/^[=+@-]/.test(candidate)) return value;
  if (/^-\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(candidate)) return value;
  return `'${value}`;
}

function quoteDelimited(value: string, delimiter: string): string {
  return value.includes(delimiter) || /["\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function serializeDelimited(rows: string[][], delimiter: "," | "\t", formulaProtection = true): string {
  return rows.map((row) => row.map((value) => quoteDelimited(formulaProtection ? protectFormula(value) : value, delimiter)).join(delimiter)).join("\r\n");
}

function uniqueHeaders(row: string[]): string[] {
  const used = new Set<string>();
  return row.map((value, index) => {
    const base = value.trim() || `column_${index + 1}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) { candidate = `${base}_${suffix}`; suffix += 1; }
    used.add(candidate);
    return candidate;
  });
}

export function serializeJson(rows: string[][], firstRowIsHeader = true): string {
  if (!firstRowIsHeader) return JSON.stringify(rows, null, 2);
  const width = Math.max(0, ...rows.map((row) => row.length));
  const headers = uniqueHeaders(Array.from({ length: width }, (_, index) => rows[0]?.[index] ?? ""));
  const records = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
  return JSON.stringify(records, null, 2);
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function columnName(index: number): string {
  let value = index + 1;
  let result = "";
  while (value > 0) { value -= 1; result = String.fromCharCode(65 + value % 26) + result; value = Math.floor(value / 26); }
  return result;
}

export async function createXlsx(rows: string[][], requestedSheetName = "Sheet1"): Promise<Blob> {
  ensureCellBudget(rows.length, Math.max(0, ...rows.map((row) => row.length)), rows.reduce((sum, row) => sum + row.length, 0));
  const sheetName = (requestedSheetName.replace(/[\\/*?:[\]]/g, " ").trim() || "Sheet1").slice(0, 31);
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => `<c r="${columnName(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const entries = [
    { name: "[Content_Types].xml", text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
    { name: "_rels/.rels", text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>` },
    { name: "xl/worksheets/sheet1.xml", text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>` },
  ];
  const zip = await createZip(entries.map((entry) => ({ name: entry.name, blob: new Blob([entry.text], { type: "application/xml" }) })));
  return new Blob([zip], { type: XLSX_MIME });
}

function xmlDocument(source: string): XMLDocument {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error("table-unsafe-xml");
  const documentNode = new DOMParser().parseFromString(source, "application/xml");
  if (documentNode.getElementsByTagName("parsererror").length) throw new Error("table-invalid-xlsx");
  return documentNode;
}

async function blobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("table-read-failed"));
    reader.readAsText(blob, "utf-8");
  });
}

function namedEntry(zip: OpenedZip, name: string, limit: number, required = true): ZipEntry | undefined {
  const entry = zip.directory.entries.find((candidate) => candidate.name === name);
  if (!entry) {
    if (required) throw new Error("table-invalid-xlsx");
    return undefined;
  }
  if (!entry.safe || entry.directory || entry.uncompressedSize > limit) throw new Error("table-xlsx-resource-limit");
  return entry;
}

async function entryText(zip: OpenedZip, entry: ZipEntry): Promise<string> {
  return blobText(await zip.extract(entry));
}

function relationshipPath(target: string): string {
  if (!target || /^\w+:|^\/|\\/.test(target)) throw new Error("table-invalid-xlsx");
  const parts = `xl/${target}`.split("/");
  const normalized: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") { if (normalized.length <= 1) throw new Error("table-invalid-xlsx"); normalized.pop(); }
    else normalized.push(part);
  }
  const path = normalized.join("/");
  if (!/^xl\/worksheets\/[^/]+\.xml$/i.test(path)) throw new Error("table-invalid-xlsx");
  return path;
}

function cellColumn(reference: string | null, fallback: number): number {
  if (!reference) return fallback;
  const letters = reference.match(/^[A-Za-z]+/)?.[0];
  if (!letters) return fallback;
  let value = 0;
  for (const character of letters.toUpperCase()) value = value * 26 + character.charCodeAt(0) - 64;
  return value - 1;
}

function childText(element: Element, localName: string): string {
  return Array.from(element.children).find((child) => child.localName === localName)?.textContent ?? "";
}

function parseSheet(documentNode: XMLDocument, sharedStrings: string[]): { rows: string[][]; formulaCount: number } {
  const rows: string[][] = [];
  let cellCount = 0;
  let formulaCount = 0;
  const rowNodes = Array.from(documentNode.getElementsByTagNameNS("*", "row"));
  for (let rowPosition = 0; rowPosition < rowNodes.length; rowPosition += 1) {
    const rowNode = rowNodes[rowPosition];
    const declared = Number(rowNode.getAttribute("r"));
    const rowIndex = Number.isSafeInteger(declared) && declared > 0 ? declared - 1 : rowPosition;
    ensureCellBudget(rowIndex + 1, 0, cellCount);
    while (rows.length <= rowIndex) rows.push([]);
    let fallbackColumn = 0;
    for (const cellNode of Array.from(rowNode.children).filter((node) => node.localName === "c")) {
      const column = cellColumn(cellNode.getAttribute("r"), fallbackColumn);
      ensureCellBudget(rows.length, column + 1, cellCount + 1);
      fallbackColumn = column + 1;
      const type = cellNode.getAttribute("t") ?? "n";
      const raw = childText(cellNode, "v");
      let value = raw;
      if (type === "s") {
        const index = Number(raw);
        if (!Number.isSafeInteger(index) || index < 0 || index >= sharedStrings.length) throw new Error("table-invalid-xlsx");
        value = sharedStrings[index];
      } else if (type === "inlineStr") {
        value = Array.from(cellNode.getElementsByTagNameNS("*", "t")).map((node) => node.textContent ?? "").join("");
      } else if (type === "b") value = raw === "1" ? "TRUE" : "FALSE";
      if (value.length > MAX_TABLE_CELL_CHARS) throw new Error("table-cell-size");
      if (Array.from(cellNode.children).some((node) => node.localName === "f")) formulaCount += 1;
      while (rows[rowIndex].length < column) rows[rowIndex].push("");
      rows[rowIndex][column] = value;
      cellCount += 1;
    }
  }
  while (rows.length && rows.at(-1)?.every((value) => value === "")) rows.pop();
  return { rows, formulaCount };
}

async function readXlsx(file: File, sheetIndex: number): Promise<TableDocument> {
  const zip = await openZip(file);
  const workbookEntry = namedEntry(zip, "xl/workbook.xml", XML_LIMITS["xl/workbook.xml"])!;
  const relsEntry = namedEntry(zip, "xl/_rels/workbook.xml.rels", XML_LIMITS["xl/_rels/workbook.xml.rels"])!;
  const [workbookSource, relsSource] = await Promise.all([entryText(zip, workbookEntry), entryText(zip, relsEntry)]);
  const workbook = xmlDocument(workbookSource);
  const rels = xmlDocument(relsSource);
  const relationships = new Map(Array.from(rels.getElementsByTagNameNS("*", "Relationship")).flatMap((node) => {
    if (node.getAttribute("TargetMode") === "External" || !node.getAttribute("Type")?.endsWith("/worksheet")) return [];
    const id = node.getAttribute("Id");
    const target = node.getAttribute("Target");
    return id && target ? [[id, relationshipPath(target)] as const] : [];
  }));
  const sheets = Array.from(workbook.getElementsByTagNameNS("*", "sheet")).map((node) => ({
    name: node.getAttribute("name") || "Sheet",
    relationship: node.getAttribute("r:id") || node.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || "",
  }));
  if (!sheets.length || sheetIndex < 0 || sheetIndex >= sheets.length) throw new Error("table-invalid-xlsx");
  const sharedEntry = namedEntry(zip, "xl/sharedStrings.xml", XML_LIMITS["xl/sharedStrings.xml"], false);
  const sharedStrings = sharedEntry ? Array.from(xmlDocument(await entryText(zip, sharedEntry)).getElementsByTagNameNS("*", "si"))
    .map((node) => Array.from(node.getElementsByTagNameNS("*", "t")).map((textNode) => textNode.textContent ?? "").join("")) : [];
  const sheetPath = relationships.get(sheets[sheetIndex].relationship);
  if (!sheetPath) throw new Error("table-invalid-xlsx");
  const sheetEntry = namedEntry(zip, sheetPath, 32 * 1024 * 1024)!;
  const parsed = parseSheet(xmlDocument(await entryText(zip, sheetEntry)), sharedStrings);
  return { format: "xlsx", rows: parsed.rows, sheetNames: sheets.map((sheet) => sheet.name), sheetIndex, formulaCount: parsed.formulaCount };
}

export async function readTableFile(file: File, sheetIndex = 0): Promise<TableDocument> {
  const format = tableSourceFormat(file.name);
  if (!format) throw new Error("table-unsupported");
  if (!file.size) throw new Error("table-empty");
  if (file.size > MAX_TABLE_FILE_BYTES || (format !== "xlsx" && file.size > MAX_DELIMITED_FILE_BYTES)) throw new Error("table-file-limit");
  if (format === "xlsx") return readXlsx(file, sheetIndex);
  const text = typeof file.text === "function" ? await file.text() : await blobText(file);
  return parseDelimited(text, format === "tsv" ? "\t" : undefined);
}
