import type { OutputFormat, RenameSettings } from "./types";

const INVALID_FILENAME = /[<>:"/\\|?*]/g;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

export function splitFilename(filename: string): { stem: string; extension: string } {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return { stem: filename, extension: "" };
  return { stem: filename.slice(0, dot), extension: filename.slice(dot + 1).toLowerCase() };
}

export function outputExtension(format: OutputFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

export function compileRenameRegex(settings: RenameSettings): RegExp | null {
  if (settings.mode !== "regex" || !settings.pattern) return null;
  return new RegExp(settings.pattern, `${settings.global ? "g" : ""}${settings.ignoreCase ? "i" : ""}`);
}

export function validateRename(settings: RenameSettings): string | null {
  if (settings.mode === "template" && !settings.template.trim()) return "empty-template";
  if (settings.mode === "regex") {
    if (!settings.pattern) return "empty-pattern";
    try {
      compileRenameRegex(settings);
    } catch {
      return "invalid-regex";
    }
  }
  return null;
}

export function insertToken(value: string, token: string, start = value.length, end = start): string {
  const safeStart = Math.max(0, Math.min(value.length, start));
  const safeEnd = Math.max(safeStart, Math.min(value.length, end));
  return `${value.slice(0, safeStart)}${token}${value.slice(safeEnd)}`;
}

export function inspectRegexMatch(filename: string, settings: RenameSettings): { matched: boolean; groups: string[] } {
  if (settings.mode !== "regex") return { matched: true, groups: [] };
  try {
    const regex = compileRenameRegex(settings);
    const match = regex?.exec(splitFilename(filename).stem);
    return { matched: Boolean(match), groups: match ? match.slice(1).map((value) => value ?? "") : [] };
  } catch {
    return { matched: false, groups: [] };
  }
}

type RenameContext = {
  filename: string;
  index: number;
  format: OutputFormat;
  width?: number;
  height?: number;
};

function applyTokens(value: string, context: RenameContext, sequence: string): string {
  const { stem } = splitFilename(context.filename);
  return value
    .replaceAll("{name}", stem)
    .replaceAll("{index}", sequence)
    .replaceAll("{format}", outputExtension(context.format))
    .replaceAll("{width}", context.width ? String(context.width) : "width")
    .replaceAll("{height}", context.height ? String(context.height) : "height");
}

export function sanitizeFilename(value: string): string {
  let cleaned = Array.from(value, (character) => character.charCodeAt(0) < 32 ? "_" : character)
    .join("")
    .replace(INVALID_FILENAME, "_")
    .replace(/[. ]+$/g, "")
    .trim();
  if (!cleaned) cleaned = "image";
  if (WINDOWS_RESERVED.test(cleaned)) cleaned = `_${cleaned}`;
  return cleaned.slice(0, 180);
}

export function buildOutputName(
  context: RenameContext,
  settings: RenameSettings,
): string {
  const sequenceIndex = settings.start + context.index - 1;
  const sequence = String(sequenceIndex).padStart(settings.padding, "0");
  const tokenContext = { ...context, index: sequenceIndex };
  let stem: string;
  if (settings.mode === "regex") {
    const sourceStem = splitFilename(context.filename).stem;
    try {
      const regex = compileRenameRegex(settings);
      stem = regex ? sourceStem.replace(regex, settings.replacement) : sourceStem;
    } catch {
      // Keep previews usable while the user is still composing a regular expression.
      stem = sourceStem;
    }
    stem = applyTokens(stem, tokenContext, sequence);
  } else {
    stem = applyTokens(settings.template, tokenContext, sequence);
  }
  return `${sanitizeFilename(stem)}.${outputExtension(context.format)}`;
}

export function makeUniquePath(path: string, used: Set<string>): string {
  if (!used.has(path.toLowerCase())) {
    used.add(path.toLowerCase());
    return path;
  }
  const slash = path.lastIndexOf("/");
  const directory = slash >= 0 ? path.slice(0, slash + 1) : "";
  const file = slash >= 0 ? path.slice(slash + 1) : path;
  const { stem, extension } = splitFilename(file);
  let suffix = 2;
  let candidate = "";
  do {
    candidate = `${directory}${stem}-${suffix}.${extension}`;
    suffix += 1;
  } while (used.has(candidate.toLowerCase()));
  used.add(candidate.toLowerCase());
  return candidate;
}
