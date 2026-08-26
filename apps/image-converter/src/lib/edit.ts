import {
  MAX_CANVAS_SIDE, MAX_MEGAPIXELS, decodeImageBlob, encodeCanvasToBlob,
  getFileExtension, normalizeImageBlob, outputMime,
} from "./convert";

export type EditAlign = "start" | "center" | "end";
export type CropMode = "aspect" | "inset";

export const CROP_ASPECTS = ["original", "1:1", "4:3", "3:2", "16:9", "16:10", "9:16"] as const;
export type CropAspectId = (typeof CROP_ASPECTS)[number];

export type CropInset = { top: number; right: number; bottom: number; left: number };

export interface CropOptions {
  mode: CropMode;
  aspectId: CropAspectId;
  horizontal: EditAlign;
  vertical: EditAlign;
  inset: CropInset;
}

export interface CropRect { x: number; y: number; width: number; height: number }

const MAX_INSET_PERCENT = 80;
const MAX_STITCH_INPUTS = 30;
export const MAX_STITCH_SPACING = 200;

export function aspectRatio(id: CropAspectId): number | null {
  if (id === "original") return null;
  const [width, height] = id.split(":").map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return width / height;
}

function alignOffset(available: number, align: EditAlign): number {
  if (available <= 0) return 0;
  if (align === "start") return 0;
  if (align === "end") return available;
  return Math.round(available / 2);
}

function clampRect(rect: CropRect, sourceWidth: number, sourceHeight: number): CropRect {
  const width = Math.min(Math.max(1, Math.round(rect.width)), sourceWidth);
  const height = Math.min(Math.max(1, Math.round(rect.height)), sourceHeight);
  const x = Math.min(Math.max(0, Math.round(rect.x)), sourceWidth - width);
  const y = Math.min(Math.max(0, Math.round(rect.y)), sourceHeight - height);
  return { x, y, width, height };
}

function assertCanvasBudget(width: number, height: number): void {
  if (width > MAX_CANVAS_SIDE || height > MAX_CANVAS_SIDE || width * height > MAX_MEGAPIXELS * 1_000_000) {
    throw new Error("image-too-large");
  }
}

export function calculateCropRect(sourceWidth: number, sourceHeight: number, options: CropOptions): CropRect {
  if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth < 1 || sourceHeight < 1) {
    throw new Error("crop-empty");
  }
  if (options.mode === "inset") {
    const inset = options.inset;
    const left = clampInsetPercent(inset.left);
    const right = clampInsetPercent(inset.right);
    const top = clampInsetPercent(inset.top);
    const bottom = clampInsetPercent(inset.bottom);
    const leftPx = Math.round((sourceWidth * left) / 100);
    const rightPx = Math.round((sourceWidth * right) / 100);
    const topPx = Math.round((sourceHeight * top) / 100);
    const bottomPx = Math.round((sourceHeight * bottom) / 100);
    const width = sourceWidth - leftPx - rightPx;
    const height = sourceHeight - topPx - bottomPx;
    if (width < 1 || height < 1) throw new Error("crop-empty");
    return clampRect({ x: leftPx, y: topPx, width, height }, sourceWidth, sourceHeight);
  }
  const ratio = aspectRatio(options.aspectId);
  if (ratio === null) return clampRect({ x: 0, y: 0, width: sourceWidth, height: sourceHeight }, sourceWidth, sourceHeight);
  let cropWidth = sourceWidth;
  let cropHeight = Math.round(sourceWidth / ratio);
  if (cropHeight > sourceHeight) {
    cropHeight = sourceHeight;
    cropWidth = Math.round(sourceHeight * ratio);
  }
  cropWidth = Math.max(1, Math.min(cropWidth, sourceWidth));
  cropHeight = Math.max(1, Math.min(cropHeight, sourceHeight));
  return clampRect(
    {
      x: alignOffset(sourceWidth - cropWidth, options.horizontal),
      y: alignOffset(sourceHeight - cropHeight, options.vertical),
      width: cropWidth,
      height: cropHeight,
    },
    sourceWidth,
    sourceHeight,
  );
}

function clampInsetPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(MAX_INSET_PERCENT, value);
}

export function normalizeCropOptions(options: Partial<CropOptions>): CropOptions {
  const mode: CropMode = options.mode === "inset" ? "inset" : "aspect";
  const aspectId: CropAspectId = CROP_ASPECTS.includes(options.aspectId as CropAspectId)
    ? options.aspectId as CropAspectId
    : "1:1";
  const align = (value: unknown): EditAlign => value === "start" || value === "end" ? value : "center";
  const percent = (value: unknown): number => typeof value === "number" && Number.isFinite(value)
    ? clampInsetPercent(Math.round(value))
    : 0;
  return {
    mode,
    aspectId,
    horizontal: align(options.horizontal),
    vertical: align(options.vertical),
    inset: {
      top: percent(options.inset?.top),
      right: percent(options.inset?.right),
      bottom: percent(options.inset?.bottom),
      left: percent(options.inset?.left),
    },
  };
}

export type StitchDirection = "horizontal" | "vertical" | "grid";

export interface StitchSize { width: number; height: number }

export interface StitchLayoutOptions {
  direction: StitchDirection;
  columns: number;
  spacing: number;
  alignment: EditAlign;
}

export interface StitchPlacement { index: number; x: number; y: number; width: number; height: number }

export interface StitchLayout {
  width: number;
  height: number;
  placements: StitchPlacement[];
}

export function normalizeStitchOptions(options: Partial<StitchLayoutOptions>, inputCount: number): StitchLayoutOptions {
  const direction: StitchDirection = ["horizontal", "vertical", "grid"].includes(options.direction ?? "")
    ? options.direction as StitchDirection
    : "horizontal";
  const columns = Number.isFinite(options.columns)
    ? Math.min(Math.max(1, Math.round(options.columns as number)), Math.max(1, inputCount))
    : Math.max(1, inputCount);
  const spacing = Number.isFinite(options.spacing)
    ? Math.min(Math.max(0, Math.round(options.spacing as number)), MAX_STITCH_SPACING)
    : 0;
  const alignment: EditAlign = options.alignment === "start" || options.alignment === "end" ? options.alignment : "center";
  return { direction, columns, spacing, alignment };
}

export function calculateStitchLayout(sizes: StitchSize[], options: StitchLayoutOptions): StitchLayout {
  if (!sizes.length) throw new Error("stitch-empty");
  for (const size of sizes) {
    if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width < 1 || size.height < 1) {
      throw new Error("stitch-empty");
    }
  }
  const normalized = sizes.map((size) => ({ width: Math.round(size.width), height: Math.round(size.height) }));
  const spacing = Math.max(0, Math.round(options.spacing));
  let layout: StitchLayout;
  if (options.direction === "horizontal") {
    const width = normalized.reduce((sum, size) => sum + size.width, 0) + spacing * (normalized.length - 1);
    const height = Math.max(...normalized.map((size) => size.height));
    let x = 0;
    const placements = normalized.map((size, index) => {
      const placement: StitchPlacement = { index, x, y: alignOffset(height - size.height, options.alignment), width: size.width, height: size.height };
      x += size.width + spacing;
      return placement;
    });
    layout = { width, height, placements };
  } else if (options.direction === "vertical") {
    const height = normalized.reduce((sum, size) => sum + size.height, 0) + spacing * (normalized.length - 1);
    const width = Math.max(...normalized.map((size) => size.width));
    let y = 0;
    const placements = normalized.map((size, index) => {
      const placement: StitchPlacement = { index, x: alignOffset(width - size.width, options.alignment), y, width: size.width, height: size.height };
      y += size.height + spacing;
      return placement;
    });
    layout = { width, height, placements };
  } else {
    const columnCount = Math.min(Math.max(1, Math.round(options.columns)), normalized.length);
    const rowCount = Math.ceil(normalized.length / columnCount);
    const columnWidths = Array.from({ length: columnCount }, (_, column) =>
      Math.max(...normalized.filter((_, index) => index % columnCount === column).map((size) => size.width)));
    const rowHeights = Array.from({ length: rowCount }, (_, row) =>
      Math.max(...normalized.filter((_, index) => Math.floor(index / columnCount) === row).map((size) => size.height)));
    const rowOffset = (rowIndex: number) => rowHeights.slice(0, rowIndex).reduce((sum, height) => sum + height, 0) + spacing * rowIndex;
    const columnOffset = (columnIndex: number) => columnWidths.slice(0, columnIndex).reduce((sum, width) => sum + width, 0) + spacing * columnIndex;
    const placements = normalized.map((size, index) => {
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);
      return {
        index,
        x: columnOffset(column) + alignOffset(columnWidths[column] - size.width, options.alignment),
        y: rowOffset(row) + alignOffset(rowHeights[row] - size.height, options.alignment),
        width: size.width,
        height: size.height,
      };
    });
    layout = {
      width: columnWidths.reduce((sum, width) => sum + width, 0) + spacing * (columnCount - 1),
      height: rowHeights.reduce((sum, height) => sum + height, 0) + spacing * (rowCount - 1),
      placements,
    };
  }
  assertCanvasBudget(layout.width, layout.height);
  return layout;
}

export interface EditOutputOptions {
  format: "png" | "jpeg" | "webp";
  quality: number;
  background: string;
}

export interface EditedImageResult {
  blob: Blob;
  width: number;
  height: number;
}

async function decodeFile(file: File) {
  const blob = await normalizeImageBlob(file);
  const decoded = await decodeImageBlob(blob, getFileExtension(file.name));
  assertCanvasBudget(decoded.width, decoded.height);
  return decoded;
}

async function renderOutput(
  width: number,
  height: number,
  output: EditOutputOptions,
  draw: (context: CanvasRenderingContext2D) => void,
): Promise<EditedImageResult> {
  assertCanvasBudget(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: output.format !== "jpeg" });
  if (!context) throw new Error("canvas-unavailable");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (output.format === "jpeg") {
    context.fillStyle = /^#[0-9a-f]{6}$/i.test(output.background) ? output.background : "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  draw(context);
  const blob = await encodeCanvasToBlob(canvas, outputMime(output.format), output.quality);
  return { blob, width, height };
}

export async function cropImageFile(file: File, options: CropOptions, output: EditOutputOptions): Promise<EditedImageResult> {
  const decoded = await decodeFile(file);
  try {
    const rect = calculateCropRect(decoded.width, decoded.height, options);
    return await renderOutput(rect.width, rect.height, output, (context) => {
      context.drawImage(decoded.drawable, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    });
  } finally {
    decoded.close();
  }
}

export async function stitchImageFiles(
  files: File[],
  options: StitchLayoutOptions,
  output: EditOutputOptions,
): Promise<EditedImageResult & { inputs: number }> {
  if (!files.length) throw new Error("stitch-empty");
  if (files.length > MAX_STITCH_INPUTS) throw new Error("stitch-too-many");
  const decodedFiles = [];
  try {
    for (const file of files) decodedFiles.push(await decodeFile(file));
    const layout = calculateStitchLayout(
      decodedFiles.map((decoded) => ({ width: decoded.width, height: decoded.height })),
      options,
    );
    const result = await renderOutput(layout.width, layout.height, output, (context) => {
      for (const placement of layout.placements) {
        const decoded = decodedFiles[placement.index];
        context.drawImage(decoded.drawable, placement.x, placement.y, placement.width, placement.height);
      }
    });
    return { ...result, inputs: files.length };
  } finally {
    for (const decoded of decodedFiles) decoded.close();
  }
}
