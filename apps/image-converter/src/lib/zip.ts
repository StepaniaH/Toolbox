const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  return value >>> 0;
});

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("blob-read-failed"));
    reader.readAsArrayBuffer(blob);
  });
}

function write16(view: DataView, offset: number, value: number): void { view.setUint16(offset, value, true); }
function write32(view: DataView, offset: number, value: number): void { view.setUint32(offset, value, true); }

export async function createZip(entries: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;
  let centralSize = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name.replace(/^\/+/, ""));
    const data = new Uint8Array(await readBlob(entry.blob));
    const checksum = crc32(data);
    const local = new ArrayBuffer(30);
    const localView = new DataView(local);
    write32(localView, 0, 0x04034b50); write16(localView, 4, 20); write16(localView, 6, 0x0800);
    write16(localView, 8, 0); write32(localView, 14, checksum); write32(localView, 18, data.length);
    write32(localView, 22, data.length); write16(localView, 26, name.length);
    parts.push(local, name, data);

    const header = new ArrayBuffer(46);
    const view = new DataView(header);
    write32(view, 0, 0x02014b50); write16(view, 4, 20); write16(view, 6, 20); write16(view, 8, 0x0800);
    write16(view, 10, 0); write32(view, 16, checksum); write32(view, 20, data.length); write32(view, 24, data.length);
    write16(view, 28, name.length); write32(view, 42, offset);
    central.push(header, name);
    centralSize += 46 + name.length;
    offset += 30 + name.length + data.length;
  }
  const end = new ArrayBuffer(22);
  const endView = new DataView(end);
  write32(endView, 0, 0x06054b50); write16(endView, 8, entries.length); write16(endView, 10, entries.length);
  write32(endView, 12, centralSize); write32(endView, 16, offset);
  return new Blob([...parts, ...central, end], { type: "application/zip" });
}
