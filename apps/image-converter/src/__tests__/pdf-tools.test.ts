import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  buildPdfPagePlan, buildPdfPagePreset, inspectPdfDocument, mergePdfFiles,
  parsePageOrder, parsePageSelection, rewritePdf, splitPdfPages,
} from "../lib/pdf-tools";

async function makePdf(sizes: [number, number][]): Promise<Blob> {
  const document = await PDFDocument.create();
  sizes.forEach((size) => document.addPage(size));
  return new Blob([Uint8Array.from(await document.save()).buffer], { type: "application/pdf" });
}

describe("bounded PDF page tools", () => {
  it("parses explicit page ranges and rejects incomplete reorder lists", () => {
    expect(parsePageSelection("1-3, 5, 7-6", 7)).toEqual([0, 1, 2, 4, 6, 5]);
    expect(parsePageOrder("3,1,2", 3)).toEqual([2, 0, 1]);
    expect(() => parsePageSelection("1,1", 3)).toThrow("pdf-page-selection");
    expect(() => parsePageOrder("1,3", 3)).toThrow("pdf-page-order");
  });

  it("builds page-operation previews and useful page presets", () => {
    expect(buildPdfPagePlan("remove", "2-3", 4)).toEqual({ selectedPages: [1, 2], outputPages: [0, 3], error: undefined });
    expect(buildPdfPagePlan("rotate", "4, 2", 4)).toEqual({ selectedPages: [3, 1], outputPages: [0, 1, 2, 3], error: undefined });
    expect(buildPdfPagePlan("reorder", "4-1", 4).outputPages).toEqual([3, 2, 1, 0]);
    expect(buildPdfPagePlan("remove", "1-4", 4).error).toBe("pdf-no-pages");
    expect(buildPdfPagePreset("all", 6)).toBe("1-6");
    expect(buildPdfPagePreset("odd", 6)).toBe("1, 3, 5");
    expect(buildPdfPagePreset("even", 5)).toBe("2, 4");
    expect(buildPdfPagePreset("reverse", 4)).toBe("4-1");
  });

  it("uses an exact page tree for merge, reorder, rotation, and splitting", async () => {
    const first = await makePdf([[300, 400], [500, 600]]);
    const second = await makePdf([[700, 800]]);
    const details = await inspectPdfDocument(first);
    expect(details.pageCount).toBe(2);
    expect(details.firstPageSize).toEqual([300, 400]);

    const merged = await PDFDocument.load(await readBlob(await mergePdfFiles([first, second])));
    expect(merged.getPageCount()).toBe(3);

    const rewrittenBlob = await rewritePdf(first, { pageIndices: [1, 0], rotateIndices: new Set([1]), rotation: 90 });
    const rewritten = await PDFDocument.load(await readBlob(rewrittenBlob));
    expect(rewritten.getPages().map((page) => [page.getWidth(), page.getHeight()])).toEqual([[500, 600], [300, 400]]);
    expect(rewritten.getPages()[0].getRotation().angle).toBe(90);

    const split = await splitPdfPages(first);
    expect(split).toHaveLength(2);
    expect((await PDFDocument.load(await readBlob(split[0]))).getPageCount()).toBe(1);
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
