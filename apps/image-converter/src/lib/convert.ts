import type { ConversionSettings, ImageRotation, OutputFormat } from "./types";

export const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif", "svg", "heic", "heif"] as const;
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(",");
export const MAX_FILES = 500;
export const MAX_FILE_BYTES = 512 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_CANVAS_SIDE = 16384;
export const MAX_MEGAPIXELS = 80;
export const MAX_HEIC_INPUT_BYTES = 64 * 1024 * 1024;

const SAFE_EMBEDDED_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,/i;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", bmp: "image/bmp", avif: "image/avif", svg: "image/svg+xml",
  heic: "image/heic", heif: "image/heif",
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

export function calculateOutputDimensions(width: number, height: number, rotation: ImageRotation): { width: number; height: number } {
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
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

type Drawable = ImageBitmap | HTMLImageElement | HTMLCanvasElement;

export function isHeicInput(file: Pick<File, "name" | "size">): boolean {
  return ["heic", "heif"].includes(getFileExtension(file.name));
}

async function decodeHeic(blob: Blob): Promise<{ drawable: Drawable; width: number; height: number; close: () => void }> {
  if (blob.size > MAX_HEIC_INPUT_BYTES) throw new Error("heic-file-limit");
  try {
    const { decode: decodeHeicImage } = await import("@discourse/heic");
    const imageData = await decodeHeicImage(await blob.arrayBuffer());
    if (!imageData.width || !imageData.height || imageData.width > MAX_CANVAS_SIDE || imageData.height > MAX_CANVAS_SIDE || imageData.width * imageData.height > MAX_MEGAPIXELS * 1_000_000) {
      throw new Error("image-too-large");
    }
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(imageData);
      return { drawable: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    }
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas-unavailable");
    context.putImageData(imageData, 0, 0);
    return { drawable: canvas, width: canvas.width, height: canvas.height, close: () => {} };
  } catch (error) {
    if (error instanceof Error && ["heic-file-limit", "image-too-large", "canvas-unavailable"].includes(error.message)) throw error;
    throw new Error("decode-failed");
  }
}

async function decode(blob: Blob, extension: string): Promise<{ drawable: Drawable; width: number; height: number; close: () => void }> {
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
    if (extension === "heic" || extension === "heif") return decodeHeic(blob);
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
  const decoded = await decode(sourceBlob, getFileExtension(file.name));
  try {
    const dimensions = calculateDimensions(decoded.width, decoded.height, settings);
    const outputDimensions = calculateOutputDimensions(dimensions.width, dimensions.height, settings.rotation);
    const canvas = document.createElement("canvas");
    canvas.width = outputDimensions.width;
    canvas.height = outputDimensions.height;
    const context = canvas.getContext("2d", { alpha: settings.format !== "jpeg" });
    if (!context) throw new Error("canvas-unavailable");
    if (settings.format === "jpeg") {
      context.fillStyle = settings.background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.translate(canvas.width / 2, canvas.height / 2);
    context.scale(settings.flipHorizontal ? -1 : 1, settings.flipVertical ? -1 : 1);
    context.rotate(settings.rotation * Math.PI / 180);
    context.drawImage(decoded.drawable, -dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
    const encoded = await canvasToBlob(canvas, outputMime(settings.format), settings.quality);
    const canKeep = settings.keepSmallerOriginal
      && sourceBlob.type === outputMime(settings.format)
      && dimensions.width === decoded.width
      && dimensions.height === decoded.height
      && settings.rotation === 0
      && !settings.flipHorizontal
      && !settings.flipVertical
      && sourceBlob.size < encoded.size;
    return {
      blob: canKeep ? sourceBlob : encoded,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      outputWidth: outputDimensions.width,
      outputHeight: outputDimensions.height,
      keptOriginal: canKeep,
    };
  } finally {
    decoded.close();
  }
}
