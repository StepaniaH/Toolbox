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
  reason?: "path" | "encrypted" | "method" | "size" | "ratio";
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

function pathReason(name: string): ZipEntry["reason"] | undefined {
  const normalized = name.replace(/\\/g, "/");
  if (!normalized || normalized.includes("\0") || normalized.startsWith("/") || /^[a-z]:/i.test(normalized)) return "path";
  if (normalized.split("/").some((part) => part === "..")) return "path";
  return undefined;
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
    let reason = pathReason(name);
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
  const nameLength = read16(view, entry.localOffset + 26);
  const extraLength = read16(view, entry.localOffset + 28);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  assertRange(start, entry.compressedSize, bytes.length);
  const compressed = bytes.slice(start, start + entry.compressedSize);
  let output: Uint8Array;
  if (entry.method === 0) output = compressed;
  else {
    if (typeof DecompressionStream !== "function") throw new Error("zip-deflate-unavailable");
    const compressedBuffer = compressed.buffer.slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength) as ArrayBuffer;
    const stream = new Blob([compressedBuffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    output = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  if (output.length !== entry.uncompressedSize || crc32(output) !== entry.crc) throw new Error("zip-integrity");
  const outputBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
  return new Blob([outputBuffer]);
}

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("blob-read-failed")); reader.readAsArrayBuffer(blob);
  });
}
