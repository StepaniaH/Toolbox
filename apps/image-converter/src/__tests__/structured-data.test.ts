import { describe, expect, it } from "vitest";
import {
  normalizeToRows,
  parseJsonRecords,
  parseXmlRecords,
  parseYamlRecords,
  serializeXmlRows,
  serializeYamlRows,
  stringifyCell,
} from "../lib/structured-data";

describe("normalizeToRows", () => {
  it("expands arrays of records into headers plus rows", () => {
    expect(normalizeToRows([
      { name: "Alice", age: 42 },
      { name: "Bob", role: "dev" },
    ])).toEqual([
      ["name", "age", "role"],
      ["Alice", "42", ""],
      ["Bob", "", "dev"],
    ]);
  });

  it("tabulates arrays of primitives and nested arrays", () => {
    expect(normalizeToRows([1, "a", true])).toEqual([["1"], ["a"], ["true"]]);
    expect(normalizeToRows([[1, 2], [3, 4]])).toEqual([["1", "2"], ["3", "4"]]);
  });

  it("turns plain objects into key/value tables", () => {
    expect(normalizeToRows({ host: "local", port: 8080 })).toEqual([
      ["key", "value"],
      ["host", "local"],
      ["port", "8080"],
    ]);
  });

  it("stringifies nested values as compact JSON and nulls as empty cells", () => {
    const rows = normalizeToRows([{ id: 1, meta: { tags: ["a", "b"] }, note: null }]);
    expect(rows[1]).toEqual(["1", '{"tags":["a","b"]}', ""]);
  });

  it("rejects empty collections", () => {
    expect(() => normalizeToRows([])).toThrow("structured-empty");
    expect(() => normalizeToRows({})).toThrow("structured-empty");
  });
});

describe("parseJsonRecords", () => {
  it("parses record arrays and reports syntax errors by key", () => {
    expect(parseJsonRecords('[{"id":1},{"id":2}]')).toEqual([["id"], ["1"], ["2"]]);
    expect(() => parseJsonRecords("{bad json")).toThrow("json-invalid");
  });
});

describe("parseYamlRecords", () => {
  it("parses YAML documents into the same table shape", async () => {
    const rows = await parseYamlRecords("- name: Alice\n  age: 42\n- name: Bob\n");
    expect(rows).toEqual([
      ["name", "age"],
      ["Alice", "42"],
      ["Bob", ""],
    ]);
    await expect(parseYamlRecords("a: [unclosed")).rejects.toThrow("yaml-invalid");
  });
});

describe("parseXmlRecords", () => {
  it("extracts repeated sibling elements as records with attributes", () => {
    const xml = `<root><item id="1"><name>A</name><meta><depth>2</depth></meta></item><item id="2"><name>B</name></item></root>`;
    const rows = parseXmlRecords(xml);
    expect(rows[0]).toEqual(["@id", "name", "meta.depth"]);
    expect(rows[1]).toEqual(["1", "A", "2"]);
    expect(rows[2]).toEqual(["2", "B", ""]);
  });

  it("falls back to the root element when children differ", () => {
    const rows = parseXmlRecords("<config><host>local</host><port>8080</port></config>");
    expect(rows).toEqual([["host", "port"], ["local", "8080"]]);
  });

  it("rejects unsafe declarations and malformed documents", () => {
    expect(() => parseXmlRecords("<!DOCTYPE r [<!ENTITY x SYSTEM 'x'>]><r/>")).toThrow("table-unsafe-xml");
    expect(() => parseXmlRecords("<root>< unclosed")).toThrow("xml-invalid");
  });
});

describe("serializers", () => {
  const rows = [
    ["name", "note"],
    ["A", "line with: colon"],
    ["B & C", '<tagged>'],
  ];

  it("emits YAML records that parse back to the same data", async () => {
    const yaml = await serializeYamlRows(rows, true);
    const { parse } = await import("yaml");
    expect(parse(yaml)).toEqual([
      { name: "A", note: "line with: colon" },
      { name: "B & C", note: "<tagged>" },
    ]);
    const raw = await serializeYamlRows(rows, false);
    expect(parse(raw)).toEqual([rows[0], rows[1], rows[2]]);
  });

  it("escapes XML output and sanitizes tag names", () => {
    const xml = serializeXmlRows([["odd header!", "9lives"], ["x&y", "<v>"]], true);
    expect(xml).toContain('<odd_header_>');
    expect(xml).toContain("<_9lives>");
    expect(xml).toContain("x&amp;y");
    expect(xml).not.toContain("<v>");
    const list = serializeXmlRows(rows, false);
    expect(list).toContain("<value>line with: colon</value>");
  });
});

describe("stringifyCell", () => {
  it("maps scalars, nulls and structures predictably", () => {
    expect(stringifyCell(null)).toBe("");
    expect(stringifyCell(false)).toBe("false");
    expect(stringifyCell({ a: 1 })).toBe('{"a":1}');
    expect(stringifyCell("plain")).toBe("plain");
  });
});
