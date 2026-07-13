export type PdfInspection = {
  version: string;
  pageEstimate: number;
  objectCount: number;
  encrypted: boolean;
  linearized: boolean;
  metadata: boolean;
  mediaBox?: [number, number];
};

const MAX_PDF_INSPECTION_BYTES = 32 * 1024 * 1024;

export async function inspectPdf(file: Blob): Promise<PdfInspection> {
  if (!file.size) throw new Error("pdf-empty");
  if (file.size > MAX_PDF_INSPECTION_BYTES) throw new Error("pdf-inspection-limit");
  const bytes = new Uint8Array(await readBlob(file));
  const text = new TextDecoder("latin1").decode(bytes);
  const version = text.slice(0, 1024).match(/%PDF-(\d\.\d)/)?.[1];
  if (!version) throw new Error("pdf-invalid");
  const pageEstimate = [...text.matchAll(/\/Type\s*\/Page(?!s)\b/g)].length;
  const objectCount = [...text.matchAll(/(?:^|[\r\n])\s*\d+\s+\d+\s+obj\b/g)].length;
  const media = text.match(/\/MediaBox\s*\[\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/);
  const width = media ? Number(media[1]) : NaN;
  const height = media ? Number(media[2]) : NaN;
  return {
    version,
    pageEstimate,
    objectCount,
    encrypted: /\/Encrypt\b/.test(text),
    linearized: /\/Linearized\b/.test(text.slice(0, 4096)),
    metadata: /\/Info\b|<x:xmpmeta\b/i.test(text),
    mediaBox: Number.isFinite(width) && Number.isFinite(height) ? [width, height] : undefined,
  };
}
function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("blob-read-failed")); reader.readAsArrayBuffer(blob);
  });
}
