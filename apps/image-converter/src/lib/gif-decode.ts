import { decompressFrames, parseGIF, type ParsedGif } from "gifuct-js";
import { MAX_GIF_INPUT_BYTES, MAX_GIF_FRAMES } from "./gif-limits";

export type DecodedGifFrame = {
  rgba: Uint8ClampedArray;
  delayMs: number;
};

export type DecodedGif = {
  width: number;
  height: number;
  frames: DecodedGifFrame[];
};

// GIF frames may be partial patches composited over previous frames with a
// disposal method deciding how to restore the canvas. This composites every
// frame the same way browsers do so extraction and re-encoding match what
// users see.
export async function decodeGifBytes(buffer: ArrayBuffer): Promise<DecodedGif> {
  if (buffer.byteLength > MAX_GIF_INPUT_BYTES) throw new Error("gif-input-limit");
  let parsed: ParsedGif;
  try {
    parsed = parseGIF(buffer);
  } catch {
    throw new Error("gif-decode-failed");
  }
  const width = parsed.lsd.width;
  const height = parsed.lsd.height;
  if (width < 1 || height < 1 || width > 4096 || height > 4096) throw new Error("gif-size-limit");

  let frameUnits;
  try {
    frameUnits = decompressFrames(parsed, true);
  } catch {
    throw new Error("gif-decode-failed");
  }
  if (!frameUnits.length) throw new Error("gif-empty");
  if (frameUnits.length > MAX_GIF_FRAMES) throw new Error("gif-frame-count");
  if (width * height * frameUnits.length > 100_000_000) throw new Error("gif-size-limit");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas-unavailable");

  const frames: DecodedGifFrame[] = [];
  let snapshot: ImageData | null = null;
  for (const unit of frameUnits) {
    // gifuct-js exposes flattened units: dims/delay/disposal live at the top.
    const { top, left, width: patchWidth, height: patchHeight } = unit.dims;
    const disposal = typeof unit.disposal === "number" ? unit.disposal : 0;
    if (disposal === 3) snapshot = context.getImageData(0, 0, width, height);
    if (patchWidth && patchHeight) {
      const patchImage = new ImageData(new Uint8ClampedArray(unit.patch), patchWidth, patchHeight);
      context.putImageData(patchImage, left, top);
    }
    frames.push({
      rgba: context.getImageData(0, 0, width, height).data,
      delayMs: Math.max(10, unit.delay || 100),
    });
    if (disposal === 2) {
      context.clearRect(left, top, patchWidth, patchHeight);
    } else if (disposal === 3 && snapshot) {
      context.putImageData(snapshot, 0, 0);
      snapshot = null;
    }
  }
  return { width, height, frames };
}

export async function decodeGifFile(file: File): Promise<DecodedGif> {
  if (!file.size) throw new Error("gif-empty");
  return decodeGifBytes(await file.arrayBuffer());
}

export type DecodedGifInfo = {
  width: number;
  height: number;
  frameCount: number;
  totalMs: number;
};

/** Decode once to surface frame metadata, then release the pixel buffers. */
export async function inspectGif(file: File): Promise<DecodedGifInfo> {
  const decoded = await decodeGifFile(file);
  return {
    width: decoded.width,
    height: decoded.height,
    frameCount: decoded.frames.length,
    totalMs: decoded.frames.reduce((sum, frame) => sum + frame.delayMs, 0),
  };
}

type TimingFrame = { delayMs: number };

/** Pure helpers so speed/compression timing math is unit-testable without canvas. */

export function scaleDelays<T extends TimingFrame>(frames: T[], factor: number): T[] {
  if (!Number.isFinite(factor) || factor <= 0) throw new Error("gif-speed-factor");
  return frames.map((frame) => ({ ...frame, delayMs: Math.max(10, Math.round(frame.delayMs / factor)) }));
}

export function selectFrames<T>(frames: T[], step: number): T[] {
  const kept = Number.isFinite(step) && step >= 1 ? Math.floor(step) : 1;
  if (!frames.length) throw new Error("gif-empty");
  return frames.filter((_, index) => index % kept === 0);
}

export function scaledFrames(
  frames: { rgba: Uint8ClampedArray }[],
  sourceWidth: number,
  sourceHeight: number,
  ratio: number,
): { rgba: Uint8ClampedArray; width: number; height: number; delayMs: number }[] {
  if (!frames.length) throw new Error("gif-empty");
  const safeRatio = Number.isFinite(ratio) && ratio > 0 && ratio <= 1 ? ratio : 1;
  const width = Math.max(1, Math.round(sourceWidth * safeRatio));
  const height = Math.max(1, Math.round(sourceHeight * safeRatio));
  if (width > 4096 || height > 4096 || frames.length * width * height > 100_000_000) throw new Error("gif-size-limit");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas-unavailable");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const source = document.createElement("canvas");
  source.width = sourceWidth;
  source.height = sourceHeight;
  const sourceContext = source.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) throw new Error("canvas-unavailable");
  return frames.map((frame) => {
    sourceContext.putImageData(new ImageData(frame.rgba, sourceWidth, sourceHeight), 0, 0);
    context.clearRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);
    return { rgba: context.getImageData(0, 0, width, height).data, width, height, delayMs: (frame as { delayMs?: number }).delayMs ?? 100 };
  });
}
