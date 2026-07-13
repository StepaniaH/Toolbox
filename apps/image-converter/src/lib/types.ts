export type OutputFormat = "png" | "jpeg" | "webp";
export type ResizeMode = "original" | "scale" | "fit";
export type RenameMode = "template" | "regex";
export type ImageRotation = 0 | 90 | 180 | 270;

export type ConversionSettings = {
  format: OutputFormat;
  quality: number;
  resizeMode: ResizeMode;
  scale: number;
  maxWidth: number;
  maxHeight: number;
  preventUpscale: boolean;
  rotation: ImageRotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
  background: string;
  keepSmallerOriginal: boolean;
  preserveFolders: boolean;
};

export type RenameSettings = {
  mode: RenameMode;
  template: string;
  pattern: string;
  replacement: string;
  global: boolean;
  ignoreCase: boolean;
  start: number;
  padding: number;
};

export type QueueStatus = "ready" | "converting" | "done" | "error";
export type RejectReason = "unsupported" | "empty" | "too-large" | "duplicate" | "max-files" | "total-size";

export type RejectedFile = {
  name: string;
  relativePath: string;
  size: number;
  reason: RejectReason;
};

export type QueueItem = {
  id: string;
  file: File;
  relativePath: string;
  sourceUrl: string;
  status: QueueStatus;
  output?: Blob;
  outputName?: string;
  outputUrl?: string;
  width?: number;
  height?: number;
  sourceInfoUnavailable?: boolean;
  outputWidth?: number;
  outputHeight?: number;
  error?: string;
  keptOriginal?: boolean;
};
