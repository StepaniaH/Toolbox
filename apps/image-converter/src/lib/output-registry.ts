import type { FileFamily } from "./file-identification";

export const OUTPUT_MAX_ITEMS = 200;
export const OUTPUT_MAX_BYTES = 1024 * 1024 * 1024;
export const OUTPUT_ZIP_MAX_BYTES = 512 * 1024 * 1024;
export const OUTPUT_DIRECT_DOWNLOAD_LIMIT = 10;

export type OutputTool = "home" | "image" | "gif" | "text" | "data" | "pdf" | "archive";

export type OutputDraft = {
  blob: Blob;
  name: string;
  sourceName?: string;
  family?: FileFamily;
  tool: OutputTool;
};

export type TaskOutput = OutputDraft & {
  id: string;
  family: FileFamily;
  createdAt: number;
};

export type OutputPublishResult = {
  outputs: TaskOutput[];
  added: TaskOutput[];
  rejected: number;
};

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "bmp", "tif", "tiff", "heic", "heif", "ico", "svg"]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "org", "rst", "adoc", "asciidoc", "html", "htm"]);
const DATA_EXTENSIONS = new Set(["csv", "tsv", "json", "yaml", "yml", "xml", "xlsx", "ods"]);
const ARCHIVE_EXTENSIONS = new Set(["zip", "tar", "gz", "tgz", "7z", "rar"]);

export function inferOutputFamily(name: string, mime = "", fallback: FileFamily = "unknown"): FileFamily {
  const extension = outputExtension(name);
  const normalizedMime = mime.toLowerCase();
  if (extension === "gif" || normalizedMime === "image/gif") return "gif";
  if (extension === "pdf" || normalizedMime === "application/pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(extension) || normalizedMime.startsWith("image/")) return "image";
  if (DATA_EXTENSIONS.has(extension) || /(?:json|csv|spreadsheet|excel|tab-separated|xml|yaml)/.test(normalizedMime)) return "data";
  if (TEXT_EXTENSIONS.has(extension) || normalizedMime.startsWith("text/")) return "text";
  if (ARCHIVE_EXTENSIONS.has(extension) || /(?:zip|gzip|tar|compressed)/.test(normalizedMime)) return "archive";
  return fallback;
}

export function sanitizeOutputName(value: string, fallback = "output"): string {
  const leaf = value.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "";
  const portable = [...leaf].map((character) => character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? "-" : character).join("");
  const trimmed = portable.replace(/[. ]+$/g, "").trim().slice(0, 180);
  return trimmed && trimmed !== "." && trimmed !== ".." ? trimmed : fallback;
}

export function registerTaskOutputs(current: TaskOutput[], drafts: OutputDraft[], stamp = Date.now()): OutputPublishResult {
  const next = [...current];
  const added: TaskOutput[] = [];
  let rejected = 0;
  let totalBytes = current.reduce((sum, output) => sum + output.blob.size, 0);
  const used = new Set(current.map((output) => output.name.toLocaleLowerCase("en")));
  for (const draft of drafts) {
    if (!draft.blob.size || next.length >= OUTPUT_MAX_ITEMS || totalBytes + draft.blob.size > OUTPUT_MAX_BYTES) {
      rejected += 1;
      continue;
    }
    const name = uniqueName(sanitizeOutputName(draft.name), used);
    const output: TaskOutput = {
      ...draft,
      id: `output-${stamp}-${next.length}`,
      name,
      family: draft.family ?? inferOutputFamily(name, draft.blob.type),
      createdAt: stamp,
    };
    next.push(output);
    added.push(output);
    totalBytes += draft.blob.size;
  }
  return { outputs: next, added, rejected };
}

export function renameTaskOutput(outputs: TaskOutput[], id: string, requestedName: string): TaskOutput[] {
  const target = outputs.find((output) => output.id === id);
  if (!target) return outputs;
  const used = new Set(outputs.filter((output) => output.id !== id).map((output) => output.name.toLocaleLowerCase("en")));
  const name = uniqueName(sanitizeOutputName(requestedName, target.name), used);
  return outputs.map((output) => output.id === id ? { ...output, name, family: inferOutputFamily(name, output.blob.type, output.family) } : output);
}

export function applyOutputTemplate(outputs: TaskOutput[], ids: string[], template: string): TaskOutput[] {
  const selected = new Set(ids);
  const targets = outputs.filter((output) => selected.has(output.id));
  const normalizedTemplate = template.trim();
  if (!targets.length || !normalizedTemplate || /\{(?!name\}|index\}|family\})[^}]*\}/.test(normalizedTemplate)) return outputs;
  const used = new Set(outputs.filter((output) => !selected.has(output.id)).map((output) => output.name.toLocaleLowerCase("en")));
  const width = String(targets.length).length;
  const names = new Map<string, string>();
  targets.forEach((output, index) => {
    const { stem, extension } = splitOutputName(output.name);
    const rendered = normalizedTemplate
      .replaceAll("{name}", stem)
      .replaceAll("{index}", String(index + 1).padStart(width, "0"))
      .replaceAll("{family}", output.family);
    const requested = `${rendered}${extension ? `.${extension}` : ""}`;
    names.set(output.id, uniqueName(sanitizeOutputName(requested, output.name), used));
  });
  return outputs.map((output) => names.has(output.id) ? { ...output, name: names.get(output.id)! } : output);
}

export function outputExtension(name: string): string {
  const leaf = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const index = leaf.lastIndexOf(".");
  return index > 0 && index < leaf.length - 1 ? leaf.slice(index + 1).toLowerCase() : "";
}

function splitOutputName(name: string): { stem: string; extension: string } {
  const extension = outputExtension(name);
  return { stem: extension ? name.slice(0, -(extension.length + 1)) : name, extension };
}

function uniqueName(requested: string, used: Set<string>): string {
  const { stem, extension } = splitOutputName(requested);
  let candidate = requested;
  let suffix = 2;
  while (used.has(candidate.toLocaleLowerCase("en"))) {
    candidate = `${stem}-${suffix}${extension ? `.${extension}` : ""}`;
    suffix += 1;
  }
  used.add(candidate.toLocaleLowerCase("en"));
  return candidate;
}
