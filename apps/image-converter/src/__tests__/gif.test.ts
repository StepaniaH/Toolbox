import { describe, expect, it } from "vitest";
import { encodeGif, encodeGifBytes, lzwEncode, quantize332 } from "../lib/gif";

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
});
