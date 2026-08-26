import { runPdfJob } from "./pdf-client";
import {
  PDF_MAX_SPLIT_PAGES,
  type PdfDocumentDetails, type PdfJobProgress, type PdfRewritePlan,
} from "./pdf-engine";

export { PDF_MAX_FILES, PDF_MAX_FILE_BYTES, PDF_MAX_TOTAL_BYTES, PDF_MAX_PAGES, PDF_MAX_SPLIT_PAGES, PDF_MAX_SPLIT_OUTPUT_BYTES } from "./pdf-engine";
export type { PdfDocumentDetails, PdfJobProgress } from "./pdf-engine";

export type PdfRewriteOptions = {
  pageIndices: number[];
  rotateIndices?: Set<number>;
  rotation?: 90 | 180 | 270;
};

export type PdfPageOperation = "extract" | "remove" | "reorder" | "rotate" | "split";
export type PdfPagePreset = "all" | "odd" | "even" | "first" | "last" | "reverse";
export type PdfPagePlan = { selectedPages: number[]; outputPages: number[]; error?: string };

let jobCounter = 0;

function nextJobId(): string {
  jobCounter += 1;
  return `pdf-${jobCounter}`;
}

function pdfBlob(bytes: ArrayBuffer): Blob {
  return new Blob([bytes], { type: "application/pdf" });
}

export function inspectPdfDocument(file: Blob): Promise<PdfDocumentDetails> {
  return runPdfJob<PdfDocumentDetails>({ id: nextJobId(), type: "inspect", file });
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

export async function mergePdfFiles(files: Blob[], onProgress?: PdfJobProgress): Promise<Blob> {
  const bytes = await runPdfJob<ArrayBuffer>({ id: nextJobId(), type: "merge", files }, { onProgress });
  return pdfBlob(bytes);
}

export async function rewritePdf(file: Blob, options: PdfRewriteOptions): Promise<Blob> {
  const plan: PdfRewritePlan = {
    pageIndices: options.pageIndices,
    rotateIndices: options.rotateIndices ? [...options.rotateIndices] : undefined,
    rotation: options.rotation,
  };
  const bytes = await runPdfJob<ArrayBuffer>({ id: nextJobId(), type: "rewrite", file, options: plan });
  return pdfBlob(bytes);
}

export async function splitPdfPages(file: Blob, onProgress?: PdfJobProgress): Promise<Blob[]> {
  const pages = await runPdfJob<ArrayBuffer[]>({ id: nextJobId(), type: "split", file }, { onProgress });
  return pages.map(pdfBlob);
}
