import { describe, expect, it } from "vitest";
import {
  OUTPUT_MAX_ITEMS, applyOutputTemplate, inferOutputFamily, registerTaskOutputs,
  renameTaskOutput, sanitizeOutputName,
} from "../lib/output-registry";

describe("output registry", () => {
  it("classifies generated formats without reading their bytes", () => {
    expect(inferOutputFamily("animation.gif", "image/gif")).toBe("gif");
    expect(inferOutputFamily("report.xlsx")).toBe("data");
    expect(inferOutputFamily("page.pdf")).toBe("pdf");
    expect(inferOutputFamily("photo.webp")).toBe("image");
  });

  it("sanitizes leaf names and resolves conflicts case-insensitively", () => {
    expect(sanitizeOutputName("../unsafe/<draft>.txt")).toBe("-draft-.txt");
    const first = registerTaskOutputs([], [{ blob: new Blob(["a"]), name: "Result.txt", tool: "text" }], 10);
    const second = registerTaskOutputs(first.outputs, [{ blob: new Blob(["b"]), name: "result.txt", tool: "text" }], 11);
    expect(second.added[0].name).toBe("result-2.txt");
  });

  it("applies templates only to the requested scope and keeps extensions", () => {
    const registered = registerTaskOutputs([], [
      { blob: new Blob(["a"]), name: "one.csv", tool: "data" },
      { blob: new Blob(["b"]), name: "two.csv", tool: "data" },
      { blob: new Blob(["c"]), name: "notes.txt", tool: "text" },
    ], 20);
    const renamed = applyOutputTemplate(registered.outputs, registered.outputs.slice(0, 2).map((output) => output.id), "table-{index}");
    expect(renamed.map((output) => output.name)).toEqual(["table-1.csv", "table-2.csv", "notes.txt"]);
    expect(renameTaskOutput(renamed, renamed[2].id, "table-1.csv")[2].name).toBe("table-1-2.csv");
  });

  it("enforces the in-memory item budget", () => {
    const drafts = Array.from({ length: OUTPUT_MAX_ITEMS + 2 }, (_, index) => ({ blob: new Blob([String(index)]), name: `${index}.txt`, tool: "text" as const }));
    const result = registerTaskOutputs([], drafts, 30);
    expect(result.added).toHaveLength(OUTPUT_MAX_ITEMS);
    expect(result.rejected).toBe(2);
  });
});
