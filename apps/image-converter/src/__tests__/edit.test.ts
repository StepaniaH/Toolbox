import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  calculateCropRect,
  calculateStitchLayout,
  normalizeCropOptions,
  normalizeStitchOptions,
} from "../lib/edit";

describe("crop rect calculation", () => {
  it("keeps the full frame for the original preset", () => {
    expect(calculateCropRect(1200, 800, normalizeCropOptions({ aspectId: "original" }))).toEqual({
      x: 0, y: 0, width: 1200, height: 800,
    });
  });

  it("centers a 1:1 crop inside a landscape frame", () => {
    const rect = calculateCropRect(4000, 3000, normalizeCropOptions({ aspectId: "1:1", horizontal: "center", vertical: "center" }));
    expect(rect).toEqual({ x: 500, y: 0, width: 3000, height: 3000 });
  });

  it("honours anchor alignment inside the slack space", () => {
    const start = calculateCropRect(4000, 3000, normalizeCropOptions({ aspectId: "1:1", horizontal: "start" }));
    const end = calculateCropRect(4000, 3000, normalizeCropOptions({ aspectId: "1:1", horizontal: "end" }));
    expect(start.x).toBe(0);
    expect(end.x).toBe(1000);
  });

  it("fits a 16:9 crop inside a square frame", () => {
    const rect = calculateCropRect(1000, 1000, normalizeCropOptions({ aspectId: "16:9", vertical: "start" }));
    expect(rect.width).toBe(1000);
    expect(rect.height).toBe(Math.round(1000 / (16 / 9)));
    expect(rect.y).toBe(0);
  });

  it("trims insets from all four sides", () => {
    const rect = calculateCropRect(200, 200, normalizeCropOptions({ mode: "inset", inset: { top: 10, right: 10, bottom: 10, left: 10 } }));
    expect(rect).toEqual({ x: 20, y: 20, width: 160, height: 160 });
  });

  it("rejects insets that consume the whole frame", () => {
    expect(() => calculateCropRect(100, 100, normalizeCropOptions({
      mode: "inset",
      inset: { top: 0, right: 60, bottom: 0, left: 60 },
    }))).toThrow("crop-empty");
    expect(() => calculateCropRect(0, 0, normalizeCropOptions({}))).toThrow("crop-empty");
  });

  it("normalizes unsafe options into bounded defaults", () => {
    const options = normalizeCropOptions({ mode: "nonsense" as never, aspectId: "9:99" as never, horizontal: "diagonal" as never, inset: { top: -5, right: 999, bottom: Number.NaN, left: 12.6 } as never });
    expect(options.mode).toBe("aspect");
    expect(options.aspectId).toBe("1:1");
    expect(options.horizontal).toBe("center");
    expect(options.inset).toMatchObject({ top: 0, right: 80, bottom: 0, left: 13 });
  });

  it("parses aspect ids and rejects malformed ones", () => {
    expect(aspectRatio("4:3")).toBeCloseTo(4 / 3);
    expect(aspectRatio("original")).toBeNull();
    expect(aspectRatio("0:-1" as never)).toBeNull();
  });
});

describe("stitch layout calculation", () => {
  it("lays images out horizontally with cross-axis alignment", () => {
    const layout = calculateStitchLayout(
      [{ width: 100, height: 50 }, { width: 40, height: 40 }, { width: 100, height: 50 }],
      normalizeStitchOptions({ direction: "horizontal", spacing: 10, alignment: "center" }, 3),
    );
    expect(layout.width).toBe(100 + 10 + 40 + 10 + 100);
    expect(layout.height).toBe(50);
    expect(layout.placements.map((placement) => placement.y)).toEqual([0, 5, 0]);
  });

  it("stacks images vertically", () => {
    const layout = calculateStitchLayout(
      [{ width: 100, height: 50 }, { width: 40, height: 40 }],
      normalizeStitchOptions({ direction: "vertical", spacing: 0, alignment: "end" }, 2),
    );
    expect(layout.width).toBe(100);
    expect(layout.height).toBe(90);
    expect(layout.placements[1].x).toBe(60);
    expect(layout.placements[1].y).toBe(50);
  });

  it("builds grid layouts from per-column and per-row maximums", () => {
    const layout = calculateStitchLayout(
      [
        { width: 20, height: 10 }, { width: 10, height: 10 },
        { width: 30, height: 30 }, { width: 5, height: 5 },
      ],
      normalizeStitchOptions({ direction: "grid", columns: 2, spacing: 4, alignment: "center" }, 4),
    );
    expect(layout.width).toBe(30 + 4 + 10);
    expect(layout.height).toBe(10 + 4 + 30);
    expect(layout.placements[2]).toMatchObject({ index: 2, x: 0, y: 14, width: 30, height: 30 });
    expect(layout.placements[3].x).toBeGreaterThan(34);
  });

  it("rejects empty input and oversized canvases", () => {
    expect(() => calculateStitchLayout([], normalizeStitchOptions({}, 0))).toThrow("stitch-empty");
    expect(() => calculateStitchLayout(
      [{ width: 16384, height: 16384 }, { width: 16384, height: 16384 }],
      normalizeStitchOptions({ direction: "horizontal" }, 2),
    )).toThrow("image-too-large");
  });

  it("clamps spacing and column counts through normalization", () => {
    expect(normalizeStitchOptions({ spacing: 9999, columns: 99, direction: "grid" }, 3)).toMatchObject({
      spacing: 200,
      columns: 3,
      direction: "grid",
      alignment: "center",
    });
  });
});
