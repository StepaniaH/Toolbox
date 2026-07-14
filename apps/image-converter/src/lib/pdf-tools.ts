import { inspectPdf, type PdfInspection } from "./pdf-inspector";

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

export type PdfRewriteOptions = {
  pageIndices: number[];
  rotateIndices?: Set<number>;
  rotation?: 90 | 180 | 270;
};

export type PdfPageOperation = "extract" | "remove" | "reorder" | "rotate" | "split";
export type PdfPagePreset = "all" | "odd" | "even" | "first" | "last" | "reverse";
export type PdfPagePlan = { selectedPages: number[]; outputPages: number[]; error?: string };

type PdfLib = typeof import("pdf-lib");

let pdfLibPromise: Promise<PdfLib> | undefined;

function loadPdfLib(): Promise<PdfLib> {
  pdfLibPromise ??= import("pdf-lib");
  return pdfLibPromise;
}

function assertFileBudget(file: Blob): void {
  if (!file.size) throw new Error("pdf-empty");
  if (file.size > PDF_MAX_FILE_BYTES) throw new Error("pdf-inspection-limit");
}

function normalizePdfError(reason: unknown): never {
  if (reason instanceof Error && reason.message.startsWith("pdf-")) throw reason;
  const message = reason instanceof Error ? reason.message.toLowerCase() : "";
  if (message.includes("encrypted")) throw new Error("pdf-encrypted");
  throw new Error("pdf-invalid");
}

async function loadDocument(file: Blob) {
  assertFileBudget(file);
  try {
    const { PDFDocument } = await loadPdfLib();
    const document = await PDFDocument.load(await readBlob(file), { updateMetadata: false });
    if (document.isEncrypted) throw new Error("pdf-encrypted");
    const pageCount = document.getPageCount();
    if (!pageCount) throw new Error("pdf-no-pages");
    if (pageCount > PDF_MAX_PAGES) throw new Error("pdf-page-limit");
    return document;
  } catch (reason) {
    normalizePdfError(reason);
  }
}

function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([Uint8Array.from(bytes).buffer], { type: "application/pdf" });
}

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("pdf-invalid"));
    reader.readAsArrayBuffer(blob);
  });
}

export async function inspectPdfDocument(file: Blob): Promise<PdfDocumentDetails> {
  assertFileBudget(file);
  const inspection = await inspectPdf(file);
  if (inspection.encrypted) throw new Error("pdf-encrypted");
  const document = await loadDocument(file);
  const pageCount = document.getPageCount();
  const firstPage = document.getPages()[0];
  const firstPageSize = firstPage ? [firstPage.getWidth(), firstPage.getHeight()] as [number, number] : undefined;
  return { inspection, pageCount, firstPageSize };
}

export function parsePageSelection(value: string, pageCount: number): number[] {
  const normalized = value.trim();
  if (!normalized) throw new Error("pdf-page-selection");
  const pages: number[] = [];
  const seen = new Set<number>();
  for (const token of normalized.split(/[\s,]+/).filter(Boolean)) {
    const match = token.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error("pdf-page-selection");
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) throw new Error("pdf-page-selection");
    const step = start <= end ? 1 : -1;
    for (let page = start; ; page += step) {
      if (seen.has(page)) throw new Error("pdf-page-selection");
      seen.add(page);
      pages.push(page - 1);
      if (page === end) break;
    }
  }
  return pages;
}

export function parsePageOrder(value: string, pageCount: number): number[] {
  const order = parsePageSelection(value, pageCount);
  if (order.length !== pageCount) throw new Error("pdf-page-order");
  return order;
}

export function buildPdfPagePlan(operation: PdfPageOperation, value: string, pageCount: number): PdfPagePlan {
  const allPages = Array.from({ length: pageCount }, (_, index) => index);
  if (operation === "split") {
    return { selectedPages: allPages, outputPages: allPages, error: pageCount > PDF_MAX_SPLIT_PAGES ? "pdf-split-limit" : undefined };
  }
  try {
    const selectedPages = operation === "reorder" ? parsePageOrder(value, pageCount) : parsePageSelection(value, pageCount);
    const selectedSet = new Set(selectedPages);
    const outputPages = operation === "extract" || operation === "reorder"
      ? selectedPages
      : operation === "remove"
        ? allPages.filter((page) => !selectedSet.has(page))
        : allPages;
    return { selectedPages, outputPages, error: outputPages.length ? undefined : "pdf-no-pages" };
  } catch (reason) {
    return { selectedPages: [], outputPages: [], error: reason instanceof Error ? reason.message : "pdf-page-selection" };
  }
}

export function buildPdfPagePreset(preset: PdfPagePreset, pageCount: number): string {
  if (pageCount < 1) return "";
  if (preset === "first") return "1";
  if (preset === "last") return String(pageCount);
  if (preset === "all") return pageCount === 1 ? "1" : `1-${pageCount}`;
  if (preset === "reverse") return pageCount === 1 ? "1" : `${pageCount}-1`;
  const start = preset === "odd" ? 1 : 2;
  return Array.from({ length: Math.max(0, Math.ceil((pageCount - start + 1) / 2)) }, (_, index) => start + index * 2).join(", ");
}

export async function mergePdfFiles(files: Blob[]): Promise<Blob> {
  if (files.length < 2 || files.length > PDF_MAX_FILES) throw new Error("pdf-file-count");
  if (files.reduce((sum, file) => sum + file.size, 0) > PDF_MAX_TOTAL_BYTES) throw new Error("pdf-total-limit");
  try {
    const { PDFDocument } = await loadPdfLib();
    const output = await PDFDocument.create();
    let pages = 0;
    for (const file of files) {
      const source = await loadDocument(file);
      pages += source.getPageCount();
      if (pages > PDF_MAX_PAGES) throw new Error("pdf-page-limit");
      const copied = await output.copyPages(source, source.getPageIndices());
      copied.forEach((page) => output.addPage(page));
    }
    return pdfBlob(await output.save());
  } catch (reason) {
    normalizePdfError(reason);
  }
}

export async function rewritePdf(file: Blob, options: PdfRewriteOptions): Promise<Blob> {
  if (!options.pageIndices.length) throw new Error("pdf-no-pages");
  try {
    const { PDFDocument, degrees } = await loadPdfLib();
    const source = await loadDocument(file);
    if (options.pageIndices.some((index) => index < 0 || index >= source.getPageCount())) throw new Error("pdf-page-selection");
    const output = await PDFDocument.create();
    const copied = await output.copyPages(source, options.pageIndices);
    copied.forEach((page, outputIndex) => {
      const sourceIndex = options.pageIndices[outputIndex];
      if (options.rotation && options.rotateIndices?.has(sourceIndex)) {
        page.setRotation(degrees((page.getRotation().angle + options.rotation) % 360));
      }
      output.addPage(page);
    });
    return pdfBlob(await output.save());
  } catch (reason) {
    normalizePdfError(reason);
  }
}

export async function splitPdfPages(file: Blob): Promise<Blob[]> {
  try {
    const { PDFDocument } = await loadPdfLib();
    const source = await loadDocument(file);
    if (source.getPageCount() > PDF_MAX_SPLIT_PAGES) throw new Error("pdf-split-limit");
    const outputs: Blob[] = [];
    let outputBytes = 0;
    for (const index of source.getPageIndices()) {
      const output = await PDFDocument.create();
      const [page] = await output.copyPages(source, [index]);
      output.addPage(page);
      const blob = pdfBlob(await output.save());
      outputBytes += blob.size;
      if (outputBytes > PDF_MAX_SPLIT_OUTPUT_BYTES) throw new Error("pdf-split-output-limit");
      outputs.push(blob);
    }
    return outputs;
  } catch (reason) {
    normalizePdfError(reason);
  }
}
