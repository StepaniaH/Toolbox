import { describe, expect, it } from "vitest";
import {
  createXlsx,
  detectDelimiter,
  parseDelimited,
  readTableFile,
  serializeDelimited,
  serializeJson,
} from "../lib/table-data";

describe("structured table conversion", () => {
  it("parses quoted CSV records and detects common delimiters", () => {
    const source = 'name;note\r\nAlice;"line one\nline two"\r\nBob;"a ""quote"""';
    expect(detectDelimiter(source)).toBe(";");
    expect(parseDelimited(source).rows).toEqual([
      ["name", "note"],
      ["Alice", "line one\nline two"],
      ["Bob", 'a "quote"'],
    ]);
  });

  it("protects spreadsheet formulas in delimited exports without changing negative numbers", () => {
    const output = serializeDelimited([["label", "value"], ["unsafe", "=2+2"], ["number", "-42"]], ",", true);
    expect(output).toContain("unsafe,'=2+2");
    expect(output).toContain("number,-42");
    expect(serializeDelimited([["=2+2"]], ",", false)).toBe("=2+2");
  });

  it("creates stable JSON keys from a header row", () => {
    expect(JSON.parse(serializeJson([["name", "name"], ["A", "B", "C"]], true))).toEqual([
      { name: "A", name_2: "B", column_3: "C" },
    ]);
  });

  it("writes a minimal local XLSX and reads it back without a spreadsheet dependency", async () => {
    const rows = [["name", "note", ""], ["Alice", " <private> & safe ", ""], ["公式", "=1+1", ""]];
    const xlsx = await createXlsx(rows, "Local data");
    const file = new File([await readBlob(xlsx)], "local.xlsx", { type: xlsx.type });
    const parsed = await readTableFile(file);
    expect(parsed.sheetNames).toEqual(["Local data"]);
    expect(parsed.rows).toEqual(rows);
    expect(parsed.formulaCount).toBe(0);
  });

  it("rejects unbounded columns and malformed quoted CSV", () => {
    expect(() => parseDelimited(Array.from({ length: 257 }, () => "x").join(","), ",")).toThrow("table-column-limit");
    expect(() => parseDelimited('a,"unfinished', ",")).toThrow("table-invalid-csv");
  });
});

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
