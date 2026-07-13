import { describe, expect, it } from "vitest";
import { calculateDimensions, calculateOutputDimensions, isAcceptedImage, outputMime, sanitizeSvg } from "../lib/convert";
import type { ConversionSettings } from "../lib/types";

const base: ConversionSettings = {
  format: "webp", quality: .82, resizeMode: "original", scale: 100, maxWidth: 1920, maxHeight: 1080,
  preventUpscale: true, rotation: 0, flipHorizontal: false, flipVertical: false,
  background: "#fff", keepSmallerOriginal: false, preserveFolders: true,
};

describe("conversion contracts", () => {
  it("accepts supported extensions case-insensitively and rejects disguised files", () => {
    expect(isAcceptedImage(new File(["x"], "PHOTO.JPEG"))).toBe(true);
    expect(isAcceptedImage(new File(["x"], "notes.txt", { type: "image/png" }))).toBe(false);
  });

  it("calculates proportional scale and fit dimensions", () => {
    expect(calculateDimensions(4000, 3000, { ...base, resizeMode: "scale", scale: 25 })).toEqual({ width: 1000, height: 750 });
    expect(calculateDimensions(4000, 3000, { ...base, resizeMode: "fit", maxWidth: 1000, maxHeight: 1000 })).toEqual({ width: 1000, height: 750 });
  });

  it("prevents accidental upscaling and rejects unsafe canvases", () => {
    expect(calculateDimensions(320, 200, { ...base, resizeMode: "fit", maxWidth: 1920, maxHeight: 1080 })).toEqual({ width: 320, height: 200 });
    expect(() => calculateDimensions(20000, 100, base)).toThrow("image-too-large");
    expect(() => calculateDimensions(10000, 10000, base)).toThrow("image-too-large");
  });

  it("swaps output dimensions only for quarter-turn rotations", () => {
    expect(calculateOutputDimensions(1200, 800, 0)).toEqual({ width: 1200, height: 800 });
    expect(calculateOutputDimensions(1200, 800, 90)).toEqual({ width: 800, height: 1200 });
    expect(calculateOutputDimensions(1200, 800, 180)).toEqual({ width: 1200, height: 800 });
    expect(calculateOutputDimensions(1200, 800, 270)).toEqual({ width: 800, height: 1200 });
  });

  it("maps output formats to browser MIME types", () => {
    expect(outputMime("jpeg")).toBe("image/jpeg");
    expect(outputMime("png")).toBe("image/png");
  });

  it("removes active content and external references from SVG", () => {
    const safe = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(https://example.invalid/a.css)</style><script>alert(1)</script><image href="https://example.invalid/a.png" onload="alert(1)"/><image href="data:image/svg+xml,%3Csvg%3E%3C/svg%3E"/><use href="#local"/></svg>`);
    expect(safe).not.toContain("script");
    expect(safe).not.toContain("style");
    expect(safe).not.toContain("example.invalid");
    expect(safe).not.toContain("onload");
    expect(safe).not.toContain("data:image/svg+xml");
    expect(safe).toContain('href="#local"');
  });
});
