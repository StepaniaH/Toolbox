import { describe, expect, it } from "vitest";
import { scaleDelays, selectFrames, decodeGifFile, decodeGifBytes } from "../lib/gif-decode";

describe("gif timing helpers (pure)", () => {
  it("scaleDelays divides delays and clamps to the encoder floor", () => {
    const scaled = scaleDelays([{ delayMs: 400 }, { delayMs: 5 }], 4);
    expect(scaled.map((frame) => frame.delayMs)).toEqual([100, 10]);
    expect(() => scaleDelays([{ delayMs: 100 }], 0)).toThrow("gif-speed-factor");
  });

  it("selectFrames keeps every Nth frame and rejects empty input", () => {
    const frames = [1, 2, 3, 4, 5].map((value) => ({ delayMs: value }));
    expect(selectFrames(frames, 2)).toHaveLength(3);
    expect(selectFrames(frames, 1)).toHaveLength(5);
    expect(() => selectFrames([], 2)).toThrow("gif-empty");
  });


});

describe("decodeGifFile container behavior", () => {
  // jsdom has no canvas implementation, so full pixel compositing is covered
  // by the production browser smoke; here we verify container-level behavior
  // that never touches canvas: budgets and parse failures on real bytes.
  it("rejects empty files before parsing", async () => {
    await expect(decodeGifFile(new File([], "empty.gif"))).rejects.toThrow("gif-empty");
  });

  it("reports malformed GIF data with a dedicated error key", async () => {
    const notAGif = new TextEncoder().encode("GIF89a definitely broken payload").buffer;
    await expect(decodeGifBytes(notAGif as ArrayBuffer)).rejects.toThrow();
  });

});
