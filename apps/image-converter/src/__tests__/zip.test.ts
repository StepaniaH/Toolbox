// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createZip, crc32 } from "../lib/zip";

describe("ZIP export", () => {
  it("uses the standard CRC-32 vector", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("creates a UTF-8 store-only archive with local, central, and end records", async () => {
    const zip = await createZip([
      { name: "folder/猫.webp", blob: new Blob(["one"]) },
      { name: "two.png", blob: new Blob(["two"]) },
    ]);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(bytes.length - 12, true)).toBe(2);
    expect(zip.type).toBe("application/zip");
  });
});
