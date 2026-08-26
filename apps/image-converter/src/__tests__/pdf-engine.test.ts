import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  handlePdfJobRequest, inspectPdfDocumentBytes, mergePdfDocuments,
  pdfErrorKey, rewritePdfDocument, splitPdfDocument,
} from "../lib/pdf-engine";

async function makePdfBytes(sizes: [number, number][]): Promise<ArrayBuffer> {
  const document = PDFDocument.create();
  return makePdfBytesFrom(await document, sizes);
}

async function makePdfBytesFrom(document: PDFDocument, sizes: [number, number][]): Promise<ArrayBuffer> {
  sizes.forEach((size) => document.addPage(size));
  return Uint8Array.from(await document.save()).buffer as ArrayBuffer;
}

describe("pdf engine byte-level operations", () => {
  it("merges documents in queue order and reports per-file progress", async () => {
    const first = await makePdfBytes([[300, 400], [500, 600]]);
    const second = await makePdfBytes([[700, 800]]);
    const progress: Array<[number, number]> = [];
    const merged = await mergePdfDocuments([first, second], (done, total) => progress.push([done, total]));
    const output = await PDFDocument.load(merged);
    expect(output.getPageCount()).toBe(3);
    expect(output.getPages().map((page) => [page.getWidth(), page.getHeight()])).toEqual([[300, 400], [500, 600], [700, 800]]);
    expect(progress).toEqual([[1, 2], [2, 2]]);
  });

  it("rewrites page order and rotation from raw bytes", async () => {
    const input = await makePdfBytes([[300, 400], [500, 600]]);
    const rewritten = await rewritePdfDocument(input, {
      pageIndices: [1, 0],
      rotateIndices: [1],
      rotation: 90,
    });
    const output = await PDFDocument.load(rewritten);
    expect(output.getPages().map((page) => [page.getWidth(), page.getHeight()])).toEqual([[500, 600], [300, 400]]);
    expect(output.getPages()[0].getRotation().angle).toBe(90);
  });

  it("rejects out-of-range page selections before touching pdf-lib", async () => {
    const input = await makePdfBytes([[300, 400]]);
    await expect(rewritePdfDocument(input, { pageIndices: [0, 3] })).rejects.toThrow("pdf-page-selection");
  });

  it("splits every page, reports per-page progress, and enforces the split budget", async () => {
    const input = await makePdfBytes([[300, 400], [500, 600]]);
    const progress: Array<[number, number]> = [];
    const pages = await splitPdfDocument(input, (done, total) => progress.push([done, total]));
    expect(pages).toHaveLength(2);
    expect((await PDFDocument.load(pages[0])).getPageCount()).toBe(1);
    expect(progress).toEqual([[1, 2], [2, 2]]);

    const oversized = await makePdfBytes(Array.from({ length: 51 }, () => [200, 200] as [number, number]));
    await expect(splitPdfDocument(oversized)).rejects.toThrow("pdf-split-limit");
  });

  it("inspects exact page counts and the first media box from raw bytes", async () => {
    const input = await makePdfBytes([[300, 400], [500, 600]]);
    const details = await inspectPdfDocumentBytes(input);
    expect(details.pageCount).toBe(2);
    expect(details.firstPageSize).toEqual([300, 400]);
    expect(details.inspection.version).toBe("1.7");
    expect(details.inspection.encrypted).toBe(false);
  });

  it("enforces merge budgets before parsing", async () => {
    const single = await makePdfBytes([[300, 400]]);
    await expect(mergePdfDocuments([single])).rejects.toThrow("pdf-file-count");
    const many = await Promise.all(Array.from({ length: 21 }, () => makePdfBytes([[300, 400]])));
    await expect(mergePdfDocuments(many)).rejects.toThrow("pdf-file-count");
  });

  it("normalizes malformed inputs to bounded pdf-* errors", async () => {
    const valid = await makePdfBytes([[300, 400]]);
    await expect(rewritePdfDocument(slice(valid, 0.4), { pageIndices: [0] })).rejects.toThrow("pdf-invalid");
    await expect(rewritePdfDocument(randomBytes(2048), { pageIndices: [0] })).rejects.toThrow("pdf-invalid");
    await expect(splitPdfDocument(headerOnly())).rejects.toThrow("pdf-invalid");
    await expect(inspectPdfDocumentBytes(new ArrayBuffer(0))).rejects.toThrow("pdf-empty");

    expect(pdfErrorKey(new Error("encrypted payloads are rejected"))).toBe("pdf-encrypted");
    expect(pdfErrorKey(new Error("some parser crash"))).toBe("pdf-invalid");
    expect(pdfErrorKey(new Error("pdf-empty"))).toBe("pdf-empty");
  });

  it("answers the worker job protocol for every operation", async () => {
    const first = await makePdfBytes([[300, 400], [500, 600]]);
    const second = await makePdfBytes([[700, 800]]);
    const inspected = await handlePdfJobRequest({ id: "a", type: "inspect", file: new Blob([first]) });
    expect(inspected.type).toBe("result");
    if (inspected.type === "result") {
      const details = inspected.value as { pageCount: number };
      expect(details.pageCount).toBe(2);
    }

    const mergeProgress: Array<[number, number]> = [];
    const merged = await handlePdfJobRequest({ id: "b", type: "merge", files: [new Blob([first]), new Blob([second])] }, (done, total) => mergeProgress.push([done, total]));
    expect(merged).toMatchObject({ id: "b", type: "result" });
    expect(mergeProgress).toEqual([[1, 2], [2, 2]]);

    const failed = await handlePdfJobRequest({ id: "c", type: "split", file: new Blob([randomBytes(512)]) });
    expect(failed).toEqual({ id: "c", type: "error", key: "pdf-invalid" });
  });
});

function slice(buffer: ArrayBuffer, fraction: number): ArrayBuffer {
  return buffer.slice(0, Math.floor(buffer.byteLength * fraction));
}

function randomBytes(length: number): ArrayBuffer {
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) bytes[index] = (index * 31 + 7) % 256;
  return bytes.buffer;
}

function headerOnly(): ArrayBuffer {
  return new TextEncoder().encode("%PDF-1.7\n").buffer as ArrayBuffer;
}
