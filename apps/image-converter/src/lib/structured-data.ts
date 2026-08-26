import {
  ensureCellBudget, MAX_TABLE_CELL_CHARS, uniqueHeaders, xmlEscape,
} from "./table-core";

// Hierarchical data (JSON / YAML / XML) normalized into table rows.
// Everything here is pure and synchronous except YAML serialization,
// which lazy-loads the audited `yaml` package the same way pdf-lib does.

type PlainObject = { [key: string]: unknown };

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return String(value);
  }
}

function pushCheckedRow(rows: string[][], row: string[], cellCount: number): number {
  for (const cell of row) {
    if (cell.length > MAX_TABLE_CELL_CHARS) throw new Error("table-cell-size");
  }
  ensureCellBudget(rows.length + 1, row.length, cellCount + row.length);
  rows.push(row);
  return cellCount + row.length;
}

export function normalizeToRows(value: unknown): string[][] {
  const rows: string[][] = [];
  let cellCount = 0;
  if (Array.isArray(value)) {
    if (!value.length) throw new Error("structured-empty");
    if (value.every(isPlainObject)) {
      const headers: string[] = [];
      for (const record of value) {
        for (const key of Object.keys(record)) {
          if (!headers.includes(key)) headers.push(key);
        }
      }
      ensureCellBudget(value.length + 1, headers.length, value.length * headers.length + headers.length);
      rows.push(headers);
      for (const record of value) {
        cellCount = pushCheckedRow(rows, headers.map((header) => stringifyCell((record as PlainObject)[header])), cellCount);
      }
      return rows;
    }
    for (const item of value) {
      const row = Array.isArray(item) ? item.map(stringifyCell) : [stringifyCell(item)];
      cellCount = pushCheckedRow(rows, row, cellCount);
    }
    return rows;
  }
  if (isPlainObject(value)) {
    if (!Object.keys(value).length) throw new Error("structured-empty");
    ensureCellBudget(Object.keys(value).length, 2, Object.keys(value).length * 2);
    rows.push(["key", "value"]);
    for (const [key, item] of Object.entries(value)) {
      cellCount = pushCheckedRow(rows, [key, stringifyCell(item)], cellCount);
    }
    return rows;
  }
  return [[stringifyCell(value)]];
}

export function parseJsonRecords(text: string): string[][] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("json-invalid");
  }
  return normalizeToRows(parsed);
}

export async function parseYamlRecords(text: string): Promise<string[][]> {
  const { parse } = await import("yaml");
  let parsed: unknown;
  try {
    parsed = parse(text, { schema: "core" });
  } catch {
    throw new Error("yaml-invalid");
  }
  return normalizeToRows(parsed);
}

function flattenElement(element: Element, prefix: string, fields: Map<string, string>): void {
  for (const attribute of Array.from(element.attributes)) {
    fields.set(`${prefix}@${attribute.name}`, (attribute.value ?? "").trim());
  }
  const children = Array.from(element.children);
  const groups = new Map<string, Element[]>();
  for (const child of children) {
    const group = groups.get(child.localName) ?? [];
    group.push(child);
    groups.set(child.localName, group);
  }
  for (const [name, members] of groups) {
    members.forEach((member, index) => {
      const path = members.length > 1 ? `${prefix}${name}.${index}` : `${prefix}${name}`;
      if (member.children.length) flattenElement(member, `${path}.`, fields);
      else fields.set(path, (member.textContent ?? "").trim());
    });
  }
}

function assertSafeXmlSource(source: string): void {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error("table-unsafe-xml");
}

export function parseXmlRecords(text: string): string[][] {
  assertSafeXmlSource(text);
  const documentNode = new DOMParser().parseFromString(text, "application/xml");
  if (documentNode.getElementsByTagName("parsererror").length) throw new Error("xml-invalid");
  const root = documentNode.documentElement;
  if (!root) throw new Error("xml-invalid");

  const rootChildren = Array.from(root.children);
  const recordElements = rootChildren.length
    && rootChildren.every((child) => child.localName === rootChildren[0].localName)
    ? rootChildren
    : [root];
  if (recordElements === rootChildren && !rootChildren.length) {
    const text_ = (root.textContent ?? "").trim();
    if (!text_) throw new Error("structured-empty");
    return [[text_]];
  }

  const fieldOrder: string[] = [];
  const records = recordElements.map((element) => {
    const fields = new Map<string, string>();
    flattenElement(element, "", fields);
    for (const key of fields.keys()) {
      if (!fieldOrder.includes(key)) fieldOrder.push(key);
    }
    return fields;
  });
  if (!fieldOrder.length) throw new Error("structured-empty");

  const rows: string[][] = [fieldOrder];
  let cellCount = fieldOrder.length;
  for (const fields of records) {
    cellCount = pushCheckedRow(rows, fieldOrder.map((field) => fields.get(field) ?? ""), cellCount);
  }
  return rows;
}

export async function serializeYamlRows(rows: string[][], firstRowIsHeader = true): Promise<string> {
  const { stringify } = await import("yaml");
  if (!firstRowIsHeader) return stringify(rows.map((row) => [...row]));
  const headers = uniqueHeaders(rows[0] ?? []);
  const records = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
  return stringify(records);
}

function xmlTagName(header: string, index: number): string {
  const sanitized = header.replace(/[^A-Za-z0-9_.-]/g, "_").replace(/^([^A-Za-z_])/, "_$1");
  return sanitized || `field_${index + 1}`;
}

export function serializeXmlRows(rows: string[][], firstRowIsHeader = true): string {
  const body = firstRowIsHeader
    ? (() => {
      const headers = uniqueHeaders(rows[0] ?? []).map(xmlTagName);
      return rows.slice(1).map((row) =>
        `<record>${headers.map((header, index) => `<${header}>${xmlEscape(row[index] ?? "")}</${header}>`).join("")}</record>`,
      ).join("");
    })()
    : rows.map((row) => `<record>${row.map((value) => `<value>${xmlEscape(value)}</value>`).join("")}</record>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<records>${body}</records>`;
}
