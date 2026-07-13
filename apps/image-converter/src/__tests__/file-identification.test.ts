import { describe, expect, it } from "vitest";
import { IDENTIFICATION_READ_LIMIT, identifyFile } from "../lib/file-identification";

function file(name: string, bytes: number[] | string, type = ""): File {
  return new File([typeof bytes === "string" ? bytes : new Uint8Array(bytes)], name, { type });
}

describe("local file identification", () => {
  it("prefers file signatures and reports disguised extensions", async () => {
    const result = await identifyFile(file("holiday.pdf", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(result).toMatchObject({ family: "image", format: "PNG", source: "signature", mismatch: true });
  });

  it("recognizes animation, PDF, archive, TIFF, ICO, AVIF, HEIC, and SVG signatures", async () => {
    const samples = [
      ["a.gif", "GIF89a", "gif", "GIF"],
      ["a.pdf", "%PDF-1.7", "pdf", "PDF"],
      ["a.zip", [0x50, 0x4b, 0x03, 0x04], "archive", "ZIP"],
      ["a.tiff", [0x49, 0x49, 0x2a, 0x00], "image", "TIFF"],
      ["a.ico", [0x00, 0x00, 0x01, 0x00], "image", "ICO"],
      ["a.avif", [0, 0, 0, 24, 102, 116, 121, 112, 97, 118, 105, 102], "image", "AVIF"],
      ["a.heic", [0, 0, 0, 24, 102, 116, 121, 112, 104, 101, 105, 99], "image", "HEIC"],
      ["a.svg", "<?xml version=\"1.0\"?><svg viewBox=\"0 0 1 1\"></svg>", "image", "SVG"],
    ] as const;
    for (const [name, bytes, family, format] of samples) {
      expect(await identifyFile(file(name, bytes))).toMatchObject({ family, format, source: "signature" });
    }
  });

  it("classifies supported text and data names without treating recognition as decoding", async () => {
    expect(await identifyFile(file("notes.md", "# Notes"))).toMatchObject({ family: "text", format: "Markdown", source: "extension" });
    expect(await identifyFile(file("records.yaml", "safe: true"))).toMatchObject({ family: "data", format: "YAML", source: "extension" });
    expect(await identifyFile(file("unknown.bin", [1, 2, 3]))).toMatchObject({ family: "unknown", source: "unknown" });
  });

  it("never needs more than the documented identification prefix", async () => {
    const source = file("large.png", new Uint8Array(IDENTIFICATION_READ_LIMIT + 10).fill(1) as unknown as number[]);
    let end = 0;
    const original = source.slice.bind(source);
    source.slice = ((start?: number, nextEnd?: number, contentType?: string) => {
      end = nextEnd ?? source.size;
      return original(start, nextEnd, contentType);
    }) as typeof source.slice;
    await identifyFile(source);
    expect(end).toBe(IDENTIFICATION_READ_LIMIT);
  });
});
