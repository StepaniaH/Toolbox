import { describe, expect, it } from "vitest";
import { encodeGif, encodeGifBytes, lzwEncode, quantize332 } from "../lib/gif";

function decodeLzw(bytes: Uint8Array): Uint8Array {
  let offset = 0;
  let current = 0;
  let bitCount = 0;
  const read = (size: number) => {
    while (bitCount < size) { current |= (bytes[offset++] ?? 0) << bitCount; bitCount += 8; }
    const code = current & ((1 << size) - 1);
    current >>>= size; bitCount -= size;
    return code;
  };
  const clear = 256;
  const end = 257;
  let dictionary: number[][] = [];
  let codeSize = 9;
  const reset = () => {
    dictionary = Array.from({ length: 258 }, (_, index) => index < 256 ? [index] : []);
    codeSize = 9;
  };
  reset();
  const output: number[] = [];
  let previous: number[] | null = null;
  while (offset < bytes.length || bitCount >= codeSize) {
    const code = read(codeSize);
    if (code === clear) { reset(); previous = null; continue; }
    if (code === end) break;
    const entry = dictionary[code] ?? (code === dictionary.length && previous ? [...previous, previous[0]] : []);
    output.push(...entry);
    if (previous) {
      dictionary.push([...previous, entry[0]]);
      if (dictionary.length === (1 << codeSize) && codeSize < 12) codeSize += 1;
    }
    previous = entry;
  }
  return Uint8Array.from(output);
}

describe("GIF encoding", () => {
  it("quantizes RGBA pixels into the fixed 3-3-2 palette", () => {
    expect([...quantize332(new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]))]).toEqual([224, 28]);
  });

  it("writes valid animated GIF framing and loop metadata", () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]);
    const frames = [
      { rgba, width: 2, height: 1, delayMs: 120 },
      { rgba: rgba.slice().reverse(), width: 2, height: 1, delayMs: 200 },
    ];
    const bytes = encodeGifBytes(frames, { loop: 0 });
    expect(encodeGif(frames).type).toBe("image/gif");
    expect(new TextDecoder().decode(bytes.slice(0, 6))).toBe("GIF89a");
    expect(new TextDecoder().decode(bytes).includes("NETSCAPE2.0")).toBe(true);
    expect(bytes.filter((value) => value === 0x2c).length).toBeGreaterThanOrEqual(2);
    expect(bytes.at(-1)).toBe(0x3b);
  });

  it("rejects mismatched frames and emits LZW bytes", () => {
    expect(lzwEncode(new Uint8Array([1, 1, 2, 2])).length).toBeGreaterThan(2);
    expect(() => encodeGif([
      { rgba: new Uint8ClampedArray(4), width: 1, height: 1, delayMs: 100 },
      { rgba: new Uint8ClampedArray(8), width: 2, height: 1, delayMs: 100 },
    ])).toThrow("gif-frame-mismatch");
  });

  it("round-trips pixels after crossing GIF code-width boundaries", () => {
    const indices = Uint8Array.from({ length: 32_768 }, (_, index) => (index * 37 + (index >>> 4)) & 0xff);
    expect(decodeLzw(lzwEncode(indices))).toEqual(indices);
  });
});
