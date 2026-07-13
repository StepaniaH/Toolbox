import type { ConversionSettings, OutputFormat } from "./types";

export const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif", "svg"] as const;
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(",");
export const MAX_FILES = 500;
export const MAX_FILE_BYTES = 512 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_CANVAS_SIDE = 16384;
export const MAX_MEGAPIXELS = 80;

const SAFE_EMBEDDED_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,/i;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", bmp: "image/bmp", avif: "image/avif", svg: "image/svg+xml",
};

export type ConvertedImage = {
  blob: Blob;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  keptOriginal: boolean;
};

export function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_EXTENSIONS.includes(getFileExtension(file.name) as (typeof ACCEPTED_EXTENSIONS)[number]);
}

export function outputMime(format: OutputFormat): string {
  return `image/${format}`;
}

export function calculateDimensions(
  width: number,
  height: number,
  settings: Pick<ConversionSettings, "resizeMode" | "scale" | "maxWidth" | "maxHeight" | "preventUpscale">,
): { width: number; height: number } {
  let ratio = 1;
  if (settings.resizeMode === "scale") ratio = settings.scale / 100;
  if (settings.resizeMode === "fit") ratio = Math.min(settings.maxWidth / width, settings.maxHeight / height);
  if (settings.preventUpscale) ratio = Math.min(1, ratio);
  const nextWidth = Math.max(1, Math.round(width * ratio));
  const nextHeight = Math.max(1, Math.round(height * ratio));
  if (nextWidth > MAX_CANVAS_SIDE || nextHeight > MAX_CANVAS_SIDE || nextWidth * nextHeight > MAX_MEGAPIXELS * 1_000_000) {
    throw new Error("image-too-large");
  }
  return { width: nextWidth, height: nextHeight };
}

export function sanitizeSvg(source: string): string {
  const documentNode = new DOMParser().parseFromString(source, "image/svg+xml");
  if (documentNode.querySelector("parsererror")) throw new Error("decode-failed");
  for (const node of documentNode.querySelectorAll("script, style, foreignObject, iframe, object, embed")) node.remove();
  for (const element of documentNode.querySelectorAll("*")) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith("on")) element.removeAttribute(attribute.name);
      if ((name === "href" || name === "xlink:href") && !value.startsWith("#") && !SAFE_EMBEDDED_IMAGE.test(value)) {
        element.removeAttribute(attribute.name);
      }
      if (name === "src" || name === "srcset") element.removeAttribute(attribute.name);
      if (name === "style" && /(?:url\s*\(|@import|expression\s*\()/i.test(value)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return new XMLSerializer().serializeToString(documentNode.documentElement);
}

async function normalizedBlob(file: File): Promise<Blob> {
  const extension = getFileExtension(file.name);
  if (extension === "svg") return new Blob([sanitizeSvg(await file.text())], { type: "image/svg+xml" });
  return file.type ? file : new Blob([await file.arrayBuffer()], { type: MIME_BY_EXTENSION[extension] });
}

type Drawable = ImageBitmap | HTMLImageElement;

async function decode(blob: Blob): Promise<{ drawable: Drawable; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return { drawable: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall back to HTMLImageElement for formats handled outside createImageBitmap.
    }
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("decode-failed"));
      image.src = url;
    });
    return { drawable: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("encode-unsupported")), type, quality);
  });
}

export async function convertImage(file: File, settings: ConversionSettings): Promise<ConvertedImage> {
  const sourceBlob = await normalizedBlob(file);
  const decoded = await decode(sourceBlob);
  try {
    const dimensions = calculateDimensions(decoded.width, decoded.height, settings);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d", { alpha: settings.format !== "jpeg" });
    if (!context) throw new Error("canvas-unavailable");
    if (settings.format === "jpeg") {
      context.fillStyle = settings.background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.drawable, 0, 0, dimensions.width, dimensions.height);
    const encoded = await canvasToBlob(canvas, outputMime(settings.format), settings.quality);
    const canKeep = settings.keepSmallerOriginal
      && sourceBlob.type === outputMime(settings.format)
      && dimensions.width === decoded.width
      && dimensions.height === decoded.height
      && sourceBlob.size < encoded.size;
    return {
      blob: canKeep ? sourceBlob : encoded,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      outputWidth: dimensions.width,
      outputHeight: dimensions.height,
      keptOriginal: canKeep,
    };
  } finally {
    decoded.close();
  }
}
