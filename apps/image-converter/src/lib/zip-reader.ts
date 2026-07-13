import { crc32 } from "./zip";

export type ZipEntry = {
  id: number;
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  method: number;
  crc: number;
  localOffset: number;
  directory: boolean;
  safe: boolean;
  reason?: "path" | "duplicate" | "encrypted" | "method" | "size" | "ratio";
};

export type ZipDirectory = { entries: ZipEntry[]; totalUncompressed: number; comment: string };

const MAX_ENTRIES = 5000;
const MAX_ENTRY_BYTES = 256 * 1024 * 1024;
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024;

function read16(view: DataView, offset: number): number { return view.getUint16(offset, true); }
function read32(view: DataView, offset: number): number { return view.getUint32(offset, true); }
function assertRange(offset: number, length: number, total: number): void {
  if (offset < 0 || length < 0 || offset + length > total) throw new Error("zip-truncated");
}
function decodeName(bytes: Uint8Array): string { return new TextDecoder("utf-8", { fatal: false }).decode(bytes); }

function canonicalPath(name: string): string | null {
  const normalized = name.replace(/\\/g, "/");
  const hasControlCharacter = [...normalized].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
  if (!normalized || hasControlCharacter || normalized.startsWith("/") || /^[a-z]:/i.test(normalized)) return null;
  const body = normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  const parts = body.split("/");
  if (!body || parts.some((part) => !part || part === "." || part === "..")) return null;
  return parts.join("/").toLowerCase();
}

export async function readZipDirectory(file: Blob): Promise<ZipDirectory> {
  if (file.size > 512 * 1024 * 1024) throw new Error("zip-file-limit");
  const bytes = new Uint8Array(await readBlob(file));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let endOffset = -1;
  for (let offset = Math.max(0, bytes.length - 65_557); offset <= bytes.length - 22; offset += 1) {
    if (read32(view, offset) === 0x06054b50) endOffset = offset;
  }
  if (endOffset < 0) throw new Error("zip-invalid");
  if (read16(view, endOffset + 4) !== 0 || read16(view, endOffset + 6) !== 0) throw new Error("zip-multidisk");
  const entryCount = read16(view, endOffset + 10);
  const centralSize = read32(view, endOffset + 12);
  const centralOffset = read32(view, endOffset + 16);
  const commentLength = read16(view, endOffset + 20);
  if (entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) throw new Error("zip64-unsupported");
  if (entryCount > MAX_ENTRIES) throw new Error("zip-entry-limit");
  assertRange(centralOffset, centralSize, bytes.length);
  assertRange(endOffset + 22, commentLength, bytes.length);
  const entries: ZipEntry[] = [];
  const paths = new Set<string>();
  let offset = centralOffset;
  let totalUncompressed = 0;
  for (let id = 0; id < entryCount; id += 1) {
    assertRange(offset, 46, bytes.length);
    if (read32(view, offset) !== 0x02014b50) throw new Error("zip-invalid-central");
    const flags = read16(view, offset + 8);
    const method = read16(view, offset + 10);
    const checksum = read32(view, offset + 16);
    const compressedSize = read32(view, offset + 20);
    const uncompressedSize = read32(view, offset + 24);
    const nameLength = read16(view, offset + 28);
    const extraLength = read16(view, offset + 30);
    const itemCommentLength = read16(view, offset + 32);
    const localOffset = read32(view, offset + 42);
    assertRange(offset + 46, nameLength + extraLength + itemCommentLength, bytes.length);
    const name = decodeName(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const directory = name.replace(/\\/g, "/").endsWith("/");
    const path = canonicalPath(name);
    let reason: ZipEntry["reason"] | undefined = path ? undefined : "path";
    if (!reason && paths.has(path!)) reason = "duplicate";
    if (!reason) paths.add(path!);
    if (!reason && flags & 1) reason = "encrypted";
    if (!reason && method !== 0 && method !== 8) reason = "method";
    if (!reason && uncompressedSize > MAX_ENTRY_BYTES) reason = "size";
    if (!reason && compressedSize > 0 && uncompressedSize > 10 * 1024 * 1024 && uncompressedSize / compressedSize > 1000) reason = "ratio";
    totalUncompressed += uncompressedSize;
    entries.push({ id, name, compressedSize, uncompressedSize, method, crc: checksum, localOffset, directory, safe: !reason, reason });
    offset += 46 + nameLength + extraLength + itemCommentLength;
  }
  if (totalUncompressed > MAX_TOTAL_BYTES) throw new Error("zip-total-limit");
  return { entries, totalUncompressed, comment: decodeName(bytes.subarray(endOffset + 22, endOffset + 22 + commentLength)) };
}

export async function extractZipEntry(file: Blob, entry: ZipEntry): Promise<Blob> {
  if (!entry.safe || entry.directory) throw new Error("zip-entry-blocked");
  const bytes = new Uint8Array(await readBlob(file));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assertRange(entry.localOffset, 30, bytes.length);
  if (read32(view, entry.localOffset) !== 0x04034b50) throw new Error("zip-invalid-local");
  const flags = read16(view, entry.localOffset + 6);
  const method = read16(view, entry.localOffset + 8);
  const nameLength = read16(view, entry.localOffset + 26);
  const extraLength = read16(view, entry.localOffset + 28);
  assertRange(entry.localOffset + 30, nameLength + extraLength, bytes.length);
  const localName = decodeName(bytes.subarray(entry.localOffset + 30, entry.localOffset + 30 + nameLength));
  if ((flags & 1) || method !== entry.method || localName !== entry.name) throw new Error("zip-invalid-local");
  const start = entry.localOffset + 30 + nameLength + extraLength;
  assertRange(start, entry.compressedSize, bytes.length);
  const compressed = bytes.slice(start, start + entry.compressedSize);
  let output: Uint8Array;
  if (entry.method === 0) output = compressed;
  else {
    if (typeof DecompressionStream !== "function") throw new Error("zip-deflate-unavailable");
    const compressedBuffer = compressed.buffer.slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength) as ArrayBuffer;
    const stream = new Blob([compressedBuffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    output = await collectBoundedStream(stream, entry.uncompressedSize);
  }
  if (output.length !== entry.uncompressedSize || crc32(output) !== entry.crc) throw new Error("zip-integrity");
  const outputBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
  return new Blob([outputBuffer]);
}

export async function collectBoundedStream(stream: ReadableStream<Uint8Array>, expectedSize: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > expectedSize || total > MAX_ENTRY_BYTES) throw new Error("zip-integrity");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel(error).catch(() => {});
    throw error;
  }
  if (total !== expectedSize) throw new Error("zip-integrity");
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
  return output;
}

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("blob-read-failed")); reader.readAsArrayBuffer(blob);
  });
}
