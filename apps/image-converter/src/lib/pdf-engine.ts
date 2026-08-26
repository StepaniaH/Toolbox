import { inspectPdfBytes, type PdfInspection } from "./pdf-inspector";

export const PDF_MAX_FILES = 20;
export const PDF_MAX_FILE_BYTES = 32 * 1024 * 1024;
export const PDF_MAX_TOTAL_BYTES = 128 * 1024 * 1024;
export const PDF_MAX_PAGES = 500;
export const PDF_MAX_SPLIT_PAGES = 50;
export const PDF_MAX_SPLIT_OUTPUT_BYTES = 256 * 1024 * 1024;

export type PdfDocumentDetails = {
  inspection: PdfInspection;
  pageCount: number;
  firstPageSize?: [number, number];
};

export type PdfJobProgress = (done: number, total: number) => void;

export type PdfRewritePlan = {
  pageIndices: number[];
  rotateIndices?: number[];
  rotation?: 90 | 180 | 270;
};

export type PdfJobRequest =
  | { id: string; type: "inspect"; file: Blob }
  | { id: string; type: "merge"; files: Blob[] }
  | { id: string; type: "rewrite"; file: Blob; options: PdfRewritePlan }
  | { id: string; type: "split"; file: Blob };

export type PdfJobResponse =
  | { id: string; type: "progress"; done: number; total: number }
  | { id: string; type: "result"; value: unknown }
  | { id: string; type: "error"; key: string };

type PdfLib = typeof import("pdf-lib");

let pdfLibPromise: Promise<PdfLib> | undefined;

function loadPdfLib(): Promise<PdfLib> {
  pdfLibPromise ??= import("pdf-lib");
  return pdfLibPromise;
}

export function assertPdfFileBudget(sizeBytes: number): void {
  if (!sizeBytes) throw new Error("pdf-empty");
  if (sizeBytes > PDF_MAX_FILE_BYTES) throw new Error("pdf-inspection-limit");
}

export function pdfErrorKey(reason: unknown): string {
  if (reason instanceof Error && reason.message.startsWith("pdf-")) return reason.message;
  const message = reason instanceof Error ? reason.message.toLowerCase() : "";
  if (message.includes("encrypted")) return "pdf-encrypted";
  return "pdf-invalid";
}

async function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("pdf-invalid"));
    reader.readAsArrayBuffer(blob);
  });
}

async function loadPdfDocument(bytes: ArrayBuffer) {
  assertPdfFileBudget(bytes.byteLength);
  try {
    const { PDFDocument } = await loadPdfLib();
    const document = await PDFDocument.load(bytes, { updateMetadata: false });
    if (document.isEncrypted) throw new Error("pdf-encrypted");
    const pageCount = document.getPageCount();
    if (!pageCount) throw new Error("pdf-no-pages");
    if (pageCount > PDF_MAX_PAGES) throw new Error("pdf-page-limit");
    return document;
  } catch (reason) {
    if (reason instanceof Error && reason.message.startsWith("pdf-")) throw reason;
    throw new Error(pdfErrorKey(reason));
  }
}

function exactBuffer(bytes: Uint8Array): ArrayBuffer {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes.buffer as ArrayBuffer;
  }
  return Uint8Array.from(bytes).buffer as ArrayBuffer;
}

function rotateIndicesOf(plan: PdfRewritePlan): Set<number> {
  return plan.rotateIndices ? new Set(plan.rotateIndices) : new Set();
}

export async function mergePdfDocuments(inputs: ArrayBuffer[], onProgress?: PdfJobProgress): Promise<ArrayBuffer> {
  if (inputs.length < 2 || inputs.length > PDF_MAX_FILES) throw new Error("pdf-file-count");
  if (inputs.reduce((sum, input) => sum + input.byteLength, 0) > PDF_MAX_TOTAL_BYTES) throw new Error("pdf-total-limit");
  try {
    const { PDFDocument } = await loadPdfLib();
    const output = await PDFDocument.create();
    let pages = 0;
    for (const [index, input] of inputs.entries()) {
      const source = await loadPdfDocument(input);
      pages += source.getPageCount();
      if (pages > PDF_MAX_PAGES) throw new Error("pdf-page-limit");
      const copied = await output.copyPages(source, source.getPageIndices());
      copied.forEach((page) => output.addPage(page));
      onProgress?.(index + 1, inputs.length);
    }
    return exactBuffer(await output.save());
  } catch (reason) {
    if (reason instanceof Error && reason.message.startsWith("pdf-")) throw reason;
    throw new Error(pdfErrorKey(reason));
  }
}

export async function rewritePdfDocument(input: ArrayBuffer, plan: PdfRewritePlan): Promise<ArrayBuffer> {
  if (!plan.pageIndices.length) throw new Error("pdf-no-pages");
  try {
    const { PDFDocument, degrees } = await loadPdfLib();
    const source = await loadPdfDocument(input);
    const rotateIndices = rotateIndicesOf(plan);
    if (plan.pageIndices.some((index) => index < 0 || index >= source.getPageCount())) {
      throw new Error("pdf-page-selection");
    }
    const output = await PDFDocument.create();
    const copied = await output.copyPages(source, plan.pageIndices);
    copied.forEach((page, outputIndex) => {
      const sourceIndex = plan.pageIndices[outputIndex];
      if (plan.rotation && rotateIndices.has(sourceIndex)) {
        page.setRotation(degrees((page.getRotation().angle + plan.rotation) % 360));
      }
      output.addPage(page);
    });
    return exactBuffer(await output.save());
  } catch (reason) {
    if (reason instanceof Error && reason.message.startsWith("pdf-")) throw reason;
    throw new Error(pdfErrorKey(reason));
  }
}

export async function splitPdfDocument(input: ArrayBuffer, onProgress?: PdfJobProgress): Promise<ArrayBuffer[]> {
  try {
    const { PDFDocument } = await loadPdfLib();
    const source = await loadPdfDocument(input);
    if (source.getPageCount() > PDF_MAX_SPLIT_PAGES) throw new Error("pdf-split-limit");
    const outputs: ArrayBuffer[] = [];
    let outputBytes = 0;
    for (const [index, pageIndex] of source.getPageIndices().entries()) {
      const output = await PDFDocument.create();
      const [page] = await output.copyPages(source, [pageIndex]);
      output.addPage(page);
      const bytes = exactBuffer(await output.save());
      outputBytes += bytes.byteLength;
      if (outputBytes > PDF_MAX_SPLIT_OUTPUT_BYTES) throw new Error("pdf-split-output-limit");
      outputs.push(bytes);
      onProgress?.(index + 1, source.getPageCount());
    }
    return outputs;
  } catch (reason) {
    if (reason instanceof Error && reason.message.startsWith("pdf-")) throw reason;
    throw new Error(pdfErrorKey(reason));
  }
}

export async function inspectPdfDocumentBytes(bytes: ArrayBuffer): Promise<PdfDocumentDetails> {
  assertPdfFileBudget(bytes.byteLength);
  const inspection = await inspectPdfBytes(new Uint8Array(bytes));
  if (inspection.encrypted) throw new Error("pdf-encrypted");
  const document = await loadPdfDocument(bytes);
  const firstPage = document.getPages()[0];
  const firstPageSize = firstPage
    ? [firstPage.getWidth(), firstPage.getHeight()] as [number, number]
    : undefined;
  return { inspection, pageCount: document.getPageCount(), firstPageSize };
}

export async function handlePdfJobRequest(
  request: PdfJobRequest,
  onProgress?: PdfJobProgress,
): Promise<PdfJobResponse> {
  try {
    switch (request.type) {
      case "inspect": {
        const value = await inspectPdfDocumentBytes(await readBlob(request.file));
        return { id: request.id, type: "result", value };
      }
      case "merge": {
        const inputs: ArrayBuffer[] = [];
        for (const file of request.files) inputs.push(await readBlob(file));
        const value = await mergePdfDocuments(inputs, onProgress);
        return { id: request.id, type: "result", value };
      }
      case "rewrite": {
        const value = await rewritePdfDocument(await readBlob(request.file), request.options);
        return { id: request.id, type: "result", value };
      }
      case "split": {
        const value = await splitPdfDocument(await readBlob(request.file), onProgress);
        return { id: request.id, type: "result", value };
      }
    }
  } catch (reason) {
    return { id: request.id, type: "error", key: pdfErrorKey(reason) };
  }
}

export function jobTransferables(response: PdfJobResponse): Transferable[] {
  if (response.type !== "result") return [];
  const { value } = response;
  if (value instanceof ArrayBuffer) return [value];
  if (Array.isArray(value)) return value.filter((item): item is ArrayBuffer => item instanceof ArrayBuffer);
  return [];
}
