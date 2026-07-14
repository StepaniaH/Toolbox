export type FileFamily = "image" | "gif" | "pdf" | "text" | "data" | "archive" | "unknown";
export type IdentificationSource = "signature" | "extension" | "mime" | "unknown";

export type IdentifiedFile = {
  family: FileFamily;
  format: string;
  source: IdentificationSource;
  extension: string;
  mismatch: boolean;
};

export const FILE_HOME_MAX_FILES = 500;
export const FILE_HOME_MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
export const IDENTIFICATION_READ_LIMIT = 64 * 1024;

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "svg", "bmp", "tif", "tiff", "heic", "heif", "ico"]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "html", "htm", "org", "rst", "adoc", "asciidoc"]);
const DATA_EXTENSIONS = new Set(["json", "yaml", "yml", "xml", "csv", "tsv"]);
const ZIP_CONTAINER_EXTENSIONS: Record<string, { family: FileFamily; format: string }> = {
  xlsx: { family: "data", format: "XLSX" }, xlsm: { family: "data", format: "XLSM" },
  docx: { family: "unknown", format: "DOCX" }, pptx: { family: "unknown", format: "PPTX" },
  odt: { family: "unknown", format: "ODT" }, ods: { family: "data", format: "ODS" }, odp: { family: "unknown", format: "ODP" },
  epub: { family: "unknown", format: "EPUB" }, jar: { family: "unknown", format: "JAR" }, apk: { family: "unknown", format: "APK" },
};

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function normalizedFormat(extension: string): string {
  const aliases: Record<string, string> = {
    jpg: "JPEG", jpeg: "JPEG", tif: "TIFF", tiff: "TIFF", heif: "HEIC",
    htm: "HTML", md: "Markdown", markdown: "Markdown", yml: "YAML",
  };
  return aliases[extension] ?? extension.toUpperCase();
}

function familyForExtension(extension: string): FileFamily {
  if (extension === "gif") return "gif";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (extension === "pdf") return "pdf";
  if (TEXT_EXTENSIONS.has(extension)) return "text";
  if (DATA_EXTENSIONS.has(extension)) return "data";
  if (extension === "zip") return "archive";
  return "unknown";
}

function matches(bytes: Uint8Array, values: readonly number[], offset = 0): boolean {
  return values.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, start = 0, end = bytes.length): string {
  return String.fromCharCode(...bytes.subarray(start, Math.min(end, bytes.length)));
}

function signature(bytes: Uint8Array): { family: FileFamily; format: string; extensions: string[] } | null {
  if (matches(bytes, [0xff, 0xd8, 0xff])) return { family: "image", format: "JPEG", extensions: ["jpg", "jpeg"] };
  if (matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { family: "image", format: "PNG", extensions: ["png"] };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return { family: "gif", format: "GIF", extensions: ["gif"] };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return { family: "image", format: "WebP", extensions: ["webp"] };
  if (ascii(bytes, 0, 5) === "%PDF-") return { family: "pdf", format: "PDF", extensions: ["pdf"] };
  if (matches(bytes, [0x50, 0x4b, 0x03, 0x04]) || matches(bytes, [0x50, 0x4b, 0x05, 0x06]) || matches(bytes, [0x50, 0x4b, 0x07, 0x08])) return { family: "archive", format: "ZIP", extensions: ["zip"] };
  if (ascii(bytes, 0, 2) === "BM") return { family: "image", format: "BMP", extensions: ["bmp"] };
  if (matches(bytes, [0x49, 0x49, 0x2a, 0x00]) || matches(bytes, [0x4d, 0x4d, 0x00, 0x2a])) return { family: "image", format: "TIFF", extensions: ["tif", "tiff"] };
  if (matches(bytes, [0x00, 0x00, 0x01, 0x00])) return { family: "image", format: "ICO", extensions: ["ico"] };
  if (ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 32);
    if (/avif|avis/.test(brand)) return { family: "image", format: "AVIF", extensions: ["avif"] };
    if (/heic|heix|hevc|hevx|mif1|msf1/.test(brand)) return { family: "image", format: "HEIC", extensions: ["heic", "heif"] };
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 4096)).replace(/^\uFEFF/, "").trimStart();
  if (/^<svg(?:\s|>)/i.test(text) || /^<\?xml[^>]*>\s*<svg(?:\s|>)/i.test(text)) return { family: "image", format: "SVG", extensions: ["svg"] };
  return null;
}

export async function identifyFile(file: File): Promise<IdentifiedFile> {
  const extension = extensionOf(file.name);
  const prefix = file.slice(0, IDENTIFICATION_READ_LIMIT);
  const buffer = typeof prefix.arrayBuffer === "function"
    ? await prefix.arrayBuffer()
    : await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error("file-read-failed"));
      reader.readAsArrayBuffer(prefix);
    });
  const bytes = new Uint8Array(buffer);
  const detected = signature(bytes);
  if (detected) {
    const container = detected.format === "ZIP" ? ZIP_CONTAINER_EXTENSIONS[extension] : undefined;
    if (container) return { ...container, source: "extension", extension, mismatch: false };
    return {
      family: detected.family,
      format: detected.format,
      source: "signature",
      extension,
      mismatch: Boolean(extension) && !detected.extensions.includes(extension),
    };
  }
  const extensionFamily = familyForExtension(extension);
  if (extensionFamily !== "unknown") return { family: extensionFamily, format: normalizedFormat(extension), source: "extension", extension, mismatch: false };
  const mimeFamily = file.type.startsWith("image/") ? "image" : file.type.startsWith("text/") ? "text" : "unknown";
  if (mimeFamily !== "unknown") return { family: mimeFamily, format: file.type.split("/")[1]?.toUpperCase() || "Unknown", source: "mime", extension, mismatch: false };
  return { family: "unknown", format: extension ? extension.toUpperCase() : "Unknown", source: "unknown", extension, mismatch: false };
}
