export type OutputFormat = "png" | "jpeg" | "webp";
export type ResizeMode = "original" | "scale" | "fit";
export type RenameMode = "template" | "regex";

export type ConversionSettings = {
  format: OutputFormat;
  quality: number;
  resizeMode: ResizeMode;
  scale: number;
  maxWidth: number;
  maxHeight: number;
  preventUpscale: boolean;
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
  outputWidth?: number;
  outputHeight?: number;
  error?: string;
  keptOriginal?: boolean;
};
