type StorageUnitValue =
  | "B" | "KB" | "KiB" | "MB" | "MiB" | "GB" | "GiB" | "TB" | "TiB" | "PB" | "PiB";

type NetworkBandwidthUnit = "Kbps" | "Mbps" | "Gbps" | "KB/s" | "MB/s" | "MiB/s" | "GB/s";
type NetworkSizeUnit = "MB" | "MiB" | "GB" | "GiB" | "TB" | "TiB";
type VideoBitrateUnit = "Kbps" | "Mbps" | "Gbps" | "KB/s" | "MB/s" | "MiB/s";
type VideoDurationUnit = "s" | "min" | "h";
type VideoSizeUnit = "MB" | "MiB" | "GB" | "GiB" | "TB" | "TiB";
type CurrencyValue = "CNY" | "USD" | "EUR";
type LocaleCode = "zh-CN" | "en";
type VideoMode = "size" | "duration" | "bitrate";

interface SelectOption<V extends string = string> {
  value: V;
  label: string;
}

interface StoragePreset {
  label: string;
  value: number;
  unit: StorageUnitValue;
}

interface NetworkScenario {
  value: string;
  label: string;
  efficiency: number;
}

interface PowerPreset {
  label: string;
  watt: number;
}

interface VideoPreset {
  label: string;
  mode: VideoMode;
  bitrateValue?: number;
  bitrateUnit?: VideoBitrateUnit;
  durationValue?: number;
  durationUnit?: VideoDurationUnit;
  sizeValue?: number;
  sizeUnit?: VideoSizeUnit;
  audioBitrateValue: number;
  audioBitrateUnit: VideoBitrateUnit;
  overheadPercent: number;
}

const STORAGE_UNIT_SPECS = [
  { value: "B", label: "B", decimalMultiplier: 1, binaryMultiplier: 1, prefixIndex: 0 },
  { value: "KB", label: "KB", decimalMultiplier: 1000 ** 1, binaryMultiplier: 1024 ** 1, prefixIndex: 1 },
  { value: "KiB", label: "KiB", decimalMultiplier: 1000 ** 1, binaryMultiplier: 1024 ** 1, prefixIndex: 1 },
  { value: "MB", label: "MB", decimalMultiplier: 1000 ** 2, binaryMultiplier: 1024 ** 2, prefixIndex: 2 },
  { value: "MiB", label: "MiB", decimalMultiplier: 1000 ** 2, binaryMultiplier: 1024 ** 2, prefixIndex: 2 },
  { value: "GB", label: "GB", decimalMultiplier: 1000 ** 3, binaryMultiplier: 1024 ** 3, prefixIndex: 3 },
  { value: "GiB", label: "GiB", decimalMultiplier: 1000 ** 3, binaryMultiplier: 1024 ** 3, prefixIndex: 3 },
  { value: "TB", label: "TB", decimalMultiplier: 1000 ** 4, binaryMultiplier: 1024 ** 4, prefixIndex: 4 },
  { value: "TiB", label: "TiB", decimalMultiplier: 1000 ** 4, binaryMultiplier: 1024 ** 4, prefixIndex: 4 },
  { value: "PB", label: "PB", decimalMultiplier: 1000 ** 5, binaryMultiplier: 1024 ** 5, prefixIndex: 5 },
  { value: "PiB", label: "PiB", decimalMultiplier: 1000 ** 5, binaryMultiplier: 1024 ** 5, prefixIndex: 5 },
];

const STORAGE_PREFIXES = ["", "K", "M", "G", "T", "P"];
const STORAGE_BINARY_PREFIXES = ["", "Ki", "Mi", "Gi", "Ti", "Pi"];

export const STORAGE_UNIT_OPTIONS: SelectOption<StorageUnitValue>[] = [
  { value: "B", label: "B" },
  { value: "KB", label: "KB" },
  { value: "KiB", label: "KiB" },
  { value: "MB", label: "MB" },
  { value: "MiB", label: "MiB" },
  { value: "GB", label: "GB" },
  { value: "GiB", label: "GiB" },
  { value: "TB", label: "TB" },
  { value: "TiB", label: "TiB" },
  { value: "PB", label: "PB" },
  { value: "PiB", label: "PiB" },
];

export const STORAGE_PRESETS: StoragePreset[] = [
  { label: "256GB", value: 256, unit: "GB" },
  { label: "512GB", value: 512, unit: "GB" },
  { label: "1TB", value: 1, unit: "TB" },
  { label: "2TB", value: 2, unit: "TB" },
  { label: "4TB", value: 4, unit: "TB" },
  { label: "8TB", value: 8, unit: "TB" },
  { label: "12TB", value: 12, unit: "TB" },
  { label: "16TB", value: 16, unit: "TB" },
  { label: "20TB", value: 20, unit: "TB" },
  { label: "22TB", value: 22, unit: "TB" },
];

export const STORAGE_SCENARIOS: SelectOption[] = [
  { value: "drive", label: "硬盘 / SSD 厂商标称" },
  { value: "os", label: "操作系统显示" },
  { value: "memory", label: "内存容量" },
  { value: "file", label: "文件大小" },
];

export const NETWORK_UNIT_OPTIONS: SelectOption<NetworkBandwidthUnit>[] = [
  { value: "Kbps", label: "Kbps" },
  { value: "Mbps", label: "Mbps" },
  { value: "Gbps", label: "Gbps" },
  { value: "KB/s", label: "KB/s" },
  { value: "MB/s", label: "MB/s" },
  { value: "MiB/s", label: "MiB/s" },
  { value: "GB/s", label: "GB/s" },
];

export const NETWORK_SIZE_OPTIONS: SelectOption<NetworkSizeUnit>[] = [
  { value: "MB", label: "MB" },
  { value: "MiB", label: "MiB" },
  { value: "GB", label: "GB" },
  { value: "GiB", label: "GiB" },
  { value: "TB", label: "TB" },
  { value: "TiB", label: "TiB" },
];

export const NETWORK_SCENARIOS: NetworkScenario[] = [
  { value: "wired-lan", label: "有线局域网", efficiency: 95 },
  { value: "wifi", label: "Wi‑Fi", efficiency: 90 },
  { value: "public", label: "公网下载", efficiency: 80 },
  { value: "vps", label: "VPS / 良好公网", efficiency: 80 },
  { value: "vpn", label: "VPN / Tailscale", efficiency: 70 },
  { value: "crossborder", label: "跨境 / 晚高峰", efficiency: 50 },
  { value: "custom", label: "自定义", efficiency: 85 },
];

export const POWER_CURRENCY_OPTIONS: SelectOption<CurrencyValue>[] = [
  { value: "CNY", label: "CNY / 元" },
  { value: "USD", label: "USD / 美元" },
  { value: "EUR", label: "EUR / 欧元" },
];

export const POWER_PRESETS: PowerPreset[] = [
  { label: "5W", watt: 5 },
  { label: "30W", watt: 30 },
  { label: "100W", watt: 100 },
  { label: "300W", watt: 300 },
];

export const VIDEO_TARGET_OPTIONS: SelectOption<VideoMode>[] = [
  { value: "size", label: "求文件大小" },
  { value: "duration", label: "求时长" },
  { value: "bitrate", label: "求码率" },
];

export const VIDEO_BITRATE_OPTIONS: SelectOption<VideoBitrateUnit>[] = [
  { value: "Kbps", label: "Kbps" },
  { value: "Mbps", label: "Mbps" },
  { value: "Gbps", label: "Gbps" },
  { value: "KB/s", label: "KB/s" },
  { value: "MB/s", label: "MB/s" },
  { value: "MiB/s", label: "MiB/s" },
];

export const VIDEO_DURATION_OPTIONS: SelectOption<VideoDurationUnit>[] = [
  { value: "s", label: "秒" },
  { value: "min", label: "分钟" },
  { value: "h", label: "小时" },
];

export const VIDEO_SIZE_OPTIONS: SelectOption<VideoSizeUnit>[] = [
  { value: "MB", label: "MB" },
  { value: "MiB", label: "MiB" },
  { value: "GB", label: "GB" },
  { value: "GiB", label: "GiB" },
  { value: "TB", label: "TB" },
  { value: "TiB", label: "TiB" },
];

export const VIDEO_PRESETS: VideoPreset[] = [
  {
    label: "8Mbps / 1h",
    mode: "size",
    bitrateValue: 8,
    bitrateUnit: "Mbps",
    durationValue: 1,
    durationUnit: "h",
    audioBitrateValue: 128,
    audioBitrateUnit: "Kbps",
    overheadPercent: 1,
  },
  {
    label: "100GB / 8Mbps",
    mode: "duration",
    bitrateValue: 8,
    bitrateUnit: "Mbps",
    sizeValue: 100,
    sizeUnit: "GB",
    audioBitrateValue: 128,
    audioBitrateUnit: "Kbps",
    overheadPercent: 1,
  },
  {
    label: "4K / 2h",
    mode: "size",
    bitrateValue: 25,
    bitrateUnit: "Mbps",
    durationValue: 2,
    durationUnit: "h",
    audioBitrateValue: 192,
    audioBitrateUnit: "Kbps",
    overheadPercent: 1,
  },
  {
    label: "监控 / 24h",
    mode: "size",
    bitrateValue: 8,
    bitrateUnit: "Mbps",
    durationValue: 24,
    durationUnit: "h",
    audioBitrateValue: 0,
    audioBitrateUnit: "Kbps",
    overheadPercent: 2,
  },
];

export function getStorageSpec(unit: string) {
  return STORAGE_UNIT_SPECS.find((spec) => spec.value === unit) ?? STORAGE_UNIT_SPECS[0];
}

export function storageMultiplier(unit: string): number {
  const spec = getStorageSpec(unit);
  return spec.value.includes("i") ? spec.binaryMultiplier : spec.decimalMultiplier;
}

export function formatNumber(value: number, digits: number = 2): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: digits,
  }).format(safeValue);
}

export function formatInteger(value: number): string {
  return formatNumber(Math.round(value), 0);
}

export function formatBytes(bytes: number): string {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
  }).format(Math.round(bytes));
}

export function formatCompactSize(bytes: number, digits: number = 2): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `0 B`;
  if (bytes < 1024) return `${formatNumber(bytes, 0)} B`;

  const units = [
    { suffix: "B", multiplier: 1 },
    { suffix: "KiB", multiplier: 1024 ** 1 },
    { suffix: "MiB", multiplier: 1024 ** 2 },
    { suffix: "GiB", multiplier: 1024 ** 3 },
    { suffix: "TiB", multiplier: 1024 ** 4 },
    { suffix: "PiB", multiplier: 1024 ** 5 },
  ];

  let chosen = units[0];
  for (const unit of units) {
    if (bytes >= unit.multiplier) chosen = unit;
  }

  return `${formatNumber(bytes / chosen.multiplier, digits)} ${chosen.suffix}`;
}

export function formatDecimalSize(bytes: number, digits: number = 2): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `0 B`;
  if (bytes < 1000) return `${formatNumber(bytes, 0)} B`;

  const units = [
    { suffix: "B", multiplier: 1 },
    { suffix: "KB", multiplier: 1000 ** 1 },
    { suffix: "MB", multiplier: 1000 ** 2 },
    { suffix: "GB", multiplier: 1000 ** 3 },
    { suffix: "TB", multiplier: 1000 ** 4 },
    { suffix: "PB", multiplier: 1000 ** 5 },
  ];

  let chosen = units[0];
  for (const unit of units) {
    if (bytes >= unit.multiplier) chosen = unit;
  }

  return `${formatNumber(bytes / chosen.multiplier, digits)} ${chosen.suffix}`;
}

export function formatCurrencyAmount(value: number, currency: string, locale: LocaleCode = "zh-CN"): string {
  const labelMap = locale === "en"
    ? { CNY: "CNY", USD: "USD", EUR: "EUR" }
    : { CNY: "元", USD: "美元", EUR: "欧元" };
  return `${formatNumber(value, 2)} ${labelMap[currency] ?? currency}`;
}

export function formatDuration(seconds: number, locale: LocaleCode = "zh-CN"): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const en = locale === "en";
  const hLabel = en ? "hr" : "小时";
  const mLabel = en ? "min" : "分钟";
  const sLabel = en ? "sec" : "秒";
  const approx = en ? "~" : "约";

  const parts = [];
  if (hours > 0) parts.push(`${hours} ${hLabel}`);
  if (hours > 0 || minutes > 0) parts.push(`${minutes} ${mLabel}`);
  if (hours === 0 && minutes === 0) parts.push(`${secs} ${sLabel}`);

  return `${approx} ${parts.join(" ")}`;
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 2)}%`;
}

export function storageBytesFor(value: number, unit: string): number {
  return value * storageMultiplier(unit);
}

export function storageBinaryBytesFor(value: number, unit: string): number {
  const spec = getStorageSpec(unit);
  return value * spec.binaryMultiplier;
}

export interface StorageResult {
  exactBytes: number;
  directAnswer: string;
  binaryDisplay: string;
  decimalBytes: number;
  binaryEquivalentBytes: number;
  differencePercent: number;
  decimalDisplay: string;
  unitExplanation: string;
  realityNote: string;
  scenarioLabel: string;
}

export function calculateStorage(value: number, unit: string, locale: LocaleCode = "zh-CN"): StorageResult {
  const safeValue = Number.isFinite(value) ? value : 0;
  const spec = getStorageSpec(unit);
  const exactBytes = safeValue * storageMultiplier(unit);
  const binaryDisplay = formatCompactSize(exactBytes, 2);
  const decimalBytes = safeValue * spec.decimalMultiplier;
  const binaryEquivalentBytes = safeValue * spec.binaryMultiplier;
  const differencePercent = decimalBytes === 0
    ? 0
    : Math.abs((binaryEquivalentBytes - decimalBytes) / decimalBytes) * 100;

  const en = locale === "en";

  return {
    exactBytes,
    directAnswer: `${formatNumber(safeValue, 6)} ${spec.value} = ${formatBytes(exactBytes)} bytes`,
    binaryDisplay,
    decimalBytes,
    binaryEquivalentBytes,
    differencePercent,
    decimalDisplay: `${formatNumber(safeValue, 6)} ${spec.value}`,
    unitExplanation: spec.value.includes("i")
      ? (en
        ? `You selected the binary unit ${spec.value}, which operating systems and tools commonly use to display capacity.`
        : `你选的是二进制单位 ${spec.value}，操作系统和一些工具通常用它来显示容量。`)
      : (en
        ? `You selected the decimal unit ${spec.value}, which manufacturers typically use for advertised capacity.`
        : `你选的是十进制单位 ${spec.value}，厂商标称容量通常按这套规则。`),
    realityNote: en
      ? "TB/GB are decimal units; TiB/GiB are binary units. The \"missing\" capacity is usually just a difference in numbering systems."
      : "TB / GB 这类单位按十进制计量，TiB / GiB 这类单位按二进制计量；看起来少掉的容量，通常只是单位规则不同。",
    scenarioLabel: STORAGE_SCENARIOS.find((item) => item.value === "drive")?.label ?? "硬盘 / SSD 厂商标称",
  };
}

function bandwidthMultiplier(unit: string): number {
  const map = {
    Kbps: 1000,
    Mbps: 1000 ** 2,
    Gbps: 1000 ** 3,
    "KB/s": 1000 * 8,
    "MB/s": 1000 ** 2 * 8,
    "MiB/s": 1024 ** 2 * 8,
    "GB/s": 1000 ** 3 * 8,
  };
  return map[unit] ?? map.Mbps;
}

function sizeMultiplier(unit: string): number {
  return storageMultiplier(unit);
}

function durationMultiplier(unit: string): number {
  const map = {
    s: 1,
    min: 60,
    h: 3600,
  };
  return map[unit] ?? map.s;
}

export function formatBitrate(bps: number): string {
  const abs = Math.abs(bps);
  if (abs >= 1000 ** 3) return `${formatNumber(bps / 1000 ** 3, 2)} Gbps`;
  if (abs >= 1000 ** 2) return `${formatNumber(bps / 1000 ** 2, 2)} Mbps`;
  if (abs >= 1000) return `${formatNumber(bps / 1000, 2)} Kbps`;
  return `${formatNumber(bps, 0)} bps`;
}

function formatSizeUnits(bytes: number): string {
  return `${formatDecimalSize(bytes, 2)} / ${formatCompactSize(bytes, 2)}`;
}

export function bitrateToBps(value: number, unit: string): number {
  const safeValue = Number.isFinite(value) ? value : 0;
  const map = {
    Kbps: 1000,
    Mbps: 1000 ** 2,
    Gbps: 1000 ** 3,
    "KB/s": 1000 * 8,
    "MB/s": 1000 ** 2 * 8,
    "MiB/s": 1024 ** 2 * 8,
  };
  return safeValue * (map[unit] ?? map.Mbps);
}

export function durationToSeconds(value: number, unit: string): number {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue * durationMultiplier(unit);
}

export function sizeToBytes(value: number, unit: string): number {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue * storageMultiplier(unit);
}

export interface VideoInput {
  mode: VideoMode;
  bitrateValue: number;
  bitrateUnit: string;
  durationValue: number;
  durationUnit: string;
  sizeValue: number;
  sizeUnit: string;
  audioBitrateValue: number;
  audioBitrateUnit: string;
  overheadPercent: number;
  locale?: LocaleCode;
}

export interface VideoResult {
  mode: VideoMode;
  modeLabel: string;
  solvedValue: number;
  solvedLabel: string;
  displayVideoBps: number;
  displayDurationSeconds: number;
  displaySizeBytes: number;
  videoBps: number;
  audioBps: number;
  totalBps: number;
  totalBitrateWithOverhead: number;
  solvedSizeBytes: number;
  solvedDurationSeconds: number;
  solvedBitrateBps: number;
  summary: string;
  directAnswer: string;
  secondaryLine: string;
  formula: string;
  unitExplanation: string;
  realityNote: string;
  warning: string;
  overheadFactor: number;
}

export function calculateVideo({
  mode,
  bitrateValue,
  bitrateUnit,
  durationValue,
  durationUnit,
  sizeValue,
  sizeUnit,
  audioBitrateValue,
  audioBitrateUnit,
  overheadPercent,
  locale = "zh-CN",
}: VideoInput): VideoResult {
  const safeMode: VideoMode = VIDEO_TARGET_OPTIONS.some((item) => item.value === mode) ? mode : "size";
  const safeBitrateValue = Number.isFinite(bitrateValue) ? bitrateValue : 0;
  const safeDurationValue = Number.isFinite(durationValue) ? durationValue : 0;
  const safeSizeValue = Number.isFinite(sizeValue) ? sizeValue : 0;
  const safeAudioValue = Number.isFinite(audioBitrateValue) ? audioBitrateValue : 0;
  const safeOverhead = Number.isFinite(overheadPercent) ? overheadPercent : 0;

  const videoBps = bitrateToBps(safeBitrateValue, bitrateUnit);
  const audioBps = bitrateToBps(safeAudioValue, audioBitrateUnit);
  const totalBps = videoBps + audioBps;
  const overheadFactor = 1 + safeOverhead / 100;
  const durationSeconds = durationToSeconds(safeDurationValue, durationUnit);
  const sizeBytes = sizeToBytes(safeSizeValue, sizeUnit);
  const totalBitrateWithOverhead = totalBps * overheadFactor;

  let solvedBitrateBps = videoBps;
  let solvedDurationSeconds = durationSeconds;
  let solvedSizeBytes = sizeBytes;
  let warning = "";

  if (safeMode === "size") {
    solvedSizeBytes = (totalBitrateWithOverhead * durationSeconds) / 8;
  } else if (safeMode === "duration") {
    solvedDurationSeconds = totalBps > 0 ? (sizeBytes * 8) / totalBitrateWithOverhead : 0;
  } else if (safeMode === "bitrate") {
    solvedBitrateBps = durationSeconds > 0 ? sizeBytes * 8 / (durationSeconds * overheadFactor) - audioBps : 0;
    if (solvedBitrateBps < 0) {
      warning = locale === "en"
        ? "File size and duration are too small to cover audio and container overhead — video bitrate clamped to 0."
        : "当前文件大小和时长不足以覆盖音频与封装开销，视频码率已钳到 0。";
      solvedBitrateBps = 0;
    }
  }

  const en = locale === "en";

  const modeLabelMap: Record<VideoMode, string> = {
    size: en ? "File Size" : "文件大小",
    duration: en ? "Duration" : "时长",
    bitrate: en ? "Bitrate" : "码率",
  };

  const solvedLabelMap: Record<VideoMode, string> = {
    size: formatSizeUnits(solvedSizeBytes),
    duration: formatDuration(solvedDurationSeconds, locale),
    bitrate: formatBitrate(solvedBitrateBps),
  };

  const formulaMap: Record<VideoMode, string> = {
    size: "文件大小 = (视频码率 + 音频码率) × 时长 × (1 + 封装开销) ÷ 8",
    duration: "时长 = 文件大小 × 8 ÷ [(视频码率 + 音频码率) × (1 + 封装开销)]",
    bitrate: "视频码率 = 文件大小 × 8 ÷ [时长 × (1 + 封装开销)] - 音频码率",
  };

  const formulaMapEn: Record<VideoMode, string> = {
    size: "File Size = (Video Bitrate + Audio Bitrate) × Duration × (1 + Overhead) ÷ 8",
    duration: "Duration = File Size × 8 ÷ [(Video Bitrate + Audio Bitrate) × (1 + Overhead)]",
    bitrate: "Video Bitrate = File Size × 8 ÷ [Duration × (1 + Overhead)] − Audio Bitrate",
  };

  const realityMap: Record<VideoMode, string> = {
    size: en
      ? "Actual file size is also affected by encoding efficiency, keyframes, subtitles, chapters, metadata, and container format."
      : "实际文件大小还会受编码效率、关键帧、字幕、章节、元数据和封装格式影响。",
    duration: en
      ? "Actual recordable duration is limited by encoding efficiency, quality targets, and device peak bitrate."
      : "实际可录时长会受编码效率、画质目标和设备峰值码率限制。",
    bitrate: en
      ? "Actual video bitrate varies with encoder, scene complexity, and target quality — result is an engineering estimate, not pixel-accurate truth."
      : "实际视频码率会因编码器、场景复杂度和目标画质而波动，结果是工程估算，不是像素级真值。",
  };

  const solvedSummaryMap: Record<VideoMode, string> = {
    size: en
      ? `Video ${formatBitrate(videoBps)} + Audio ${formatBitrate(audioBps)}, overhead ${formatNumber(safeOverhead, 2)}%`
      : `视频 ${formatBitrate(videoBps)} + 音频 ${formatBitrate(audioBps)}，封装开销 ${formatNumber(safeOverhead, 2)}%`,
    duration: en
      ? `Video ${formatBitrate(videoBps)} + Audio ${formatBitrate(audioBps)}, overhead ${formatNumber(safeOverhead, 2)}%`
      : `视频 ${formatBitrate(videoBps)} + 音频 ${formatBitrate(audioBps)}，封装开销 ${formatNumber(safeOverhead, 2)}%`,
    bitrate: en
      ? `File ${formatSizeUnits(sizeBytes)}, Duration ${formatDuration(durationSeconds, locale)}, Audio ${formatBitrate(audioBps)}, overhead ${formatNumber(safeOverhead, 2)}%`
      : `文件 ${formatSizeUnits(sizeBytes)}，时长 ${formatDuration(durationSeconds, locale)}，音频 ${formatBitrate(audioBps)}，封装开销 ${formatNumber(safeOverhead, 2)}%`,
  };

  return {
    mode: safeMode,
    modeLabel: modeLabelMap[safeMode],
    solvedValue: safeMode === "size" ? solvedSizeBytes : safeMode === "duration" ? solvedDurationSeconds : solvedBitrateBps,
    solvedLabel: solvedLabelMap[safeMode],
    displayVideoBps: safeMode === "bitrate" ? solvedBitrateBps : videoBps,
    displayDurationSeconds: safeMode === "duration" ? solvedDurationSeconds : durationSeconds,
    displaySizeBytes: safeMode === "size" ? solvedSizeBytes : sizeBytes,
    videoBps,
    audioBps,
    totalBps,
    totalBitrateWithOverhead,
    solvedSizeBytes,
    solvedDurationSeconds,
    solvedBitrateBps,
    summary: solvedSummaryMap[safeMode],
    directAnswer:
      safeMode === "size"
        ? `${en ? "~" : "约"} ${formatSizeUnits(solvedSizeBytes)}`
        : safeMode === "duration"
          ? formatDuration(solvedDurationSeconds, locale)
          : `${en ? "~" : "约"} ${formatBitrate(solvedBitrateBps)}`,
    secondaryLine:
      safeMode === "size"
        ? (en
          ? `Total bitrate: ${formatBitrate(totalBps)}, with overhead: ${formatBitrate(totalBitrateWithOverhead)}`
          : `总码率：${formatBitrate(totalBps)}，含封装后按 ${formatBitrate(totalBitrateWithOverhead)} 计`)
        : safeMode === "duration"
          ? (en
            ? `Total bitrate: ${formatBitrate(totalBps)}, with overhead: ${formatBitrate(totalBitrateWithOverhead)}`
            : `总码率：${formatBitrate(totalBps)}，含封装后按 ${formatBitrate(totalBitrateWithOverhead)} 计`)
          : durationSeconds > 0
            ? (en
              ? `Required total bitrate: ${formatBitrate(sizeBytes * 8 / (durationSeconds * overheadFactor))} (before audio)`
              : `总需求码率：${formatBitrate(sizeBytes * 8 / (durationSeconds * overheadFactor))}（含音频前）`)
            : (en
              ? "Please fill in a valid duration to calculate bitrate."
              : "请先填写有效的时长，才能反推码率。"),
    formula: en ? formulaMapEn[safeMode] : formulaMap[safeMode],
    unitExplanation: en
      ? "Mbps/Kbps are bit-based; MB/GB are byte-based. Audio bitrate and container overhead also consume final space."
      : "Mbps / Kbps 是 bit 口径，MB / GB 是 byte 口径；音频码率和封装开销也会消耗最终空间。",
    realityNote: realityMap[safeMode],
    warning,
    overheadFactor,
  };
}

export interface NetworkInput {
  bandwidthValue: number;
  bandwidthUnit: string;
  sizeValue: number;
  sizeUnit: string;
  efficiency: number;
  scenario: string;
  locale?: LocaleCode;
}

export interface NetworkResult {
  bandwidthBps: number;
  bytesPerSecond: number;
  theoreticalMBps: number;
  theoreticalMiBps: number;
  sizeBytes: number;
  theoreticalSeconds: number;
  effectiveSeconds: number;
  theoryLine: string;
  theoreticalTimeLine: string;
  effectiveTimeLine: string;
  realityNote: string;
  scenarioLabel: string;
  efficiency: number;
}

export function calculateNetwork({
  bandwidthValue,
  bandwidthUnit,
  sizeValue,
  sizeUnit,
  efficiency,
  scenario,
  locale = "zh-CN",
}: NetworkInput): NetworkResult {
  const safeBandwidthValue = Number.isFinite(bandwidthValue) ? bandwidthValue : 0;
  const safeSizeValue = Number.isFinite(sizeValue) ? sizeValue : 0;
  const safeEfficiency = Number.isFinite(efficiency) ? efficiency : 100;
  const bps = safeBandwidthValue * bandwidthMultiplier(bandwidthUnit);
  const bytesPerSecond = bps / 8;
  const theoreticalMBps = bytesPerSecond / 1000 ** 2;
  const theoreticalMiBps = bytesPerSecond / 1024 ** 2;
  const sizeBytes = safeSizeValue * sizeMultiplier(sizeUnit);
  const theoreticalSeconds = bps > 0 ? (sizeBytes * 8) / bps : 0;
  const effectiveSeconds = safeEfficiency > 0 ? theoreticalSeconds / (safeEfficiency / 100) : 0;
  const scenarioMeta = NETWORK_SCENARIOS.find((item) => item.value === scenario) ?? NETWORK_SCENARIOS[2];

  const en = locale === "en";

  return {
    bandwidthBps: bps,
    bytesPerSecond,
    theoreticalMBps,
    theoreticalMiBps,
    sizeBytes,
    theoreticalSeconds,
    effectiveSeconds,
    theoryLine: `${formatNumber(safeBandwidthValue, 6)} ${bandwidthUnit} = ${formatNumber(theoreticalMBps, 2)} MB/s ≈ ${formatNumber(theoreticalMiBps, 2)} MiB/s`,
    theoreticalTimeLine: formatDuration(theoreticalSeconds, locale),
    effectiveTimeLine: formatDuration(effectiveSeconds, locale),
    realityNote: en
      ? `${scenarioMeta.label} is typically not 100% theoretical: protocol overhead, disk speed, Wi‑Fi, VPN, server-side limits, and link congestion all reduce actual speed.`
      : `${scenarioMeta.label} 通常不是理论 100%：协议开销、磁盘速度、Wi‑Fi、VPN、服务端限速和链路拥塞都会拉低实际速度。`,
    scenarioLabel: scenarioMeta.label,
    efficiency: safeEfficiency,
  };
}

export interface PowerInput {
  watt: number;
  hoursPerDay: number;
  daysPerYear: number;
  price: number;
  locale?: LocaleCode;
}

export interface PowerResult {
  dailyKWh: number;
  monthlyKWh: number;
  annualKWh: number;
  dailyCost: number;
  monthlyCost: number;
  annualCost: number;
  formula: string;
  directAnswer: string;
  realityNote: string;
}

export function calculatePower({ watt, hoursPerDay, daysPerYear, price, locale = "zh-CN" }: PowerInput): PowerResult {
  const safeWatt = Number.isFinite(watt) ? watt : 0;
  const safeHours = Number.isFinite(hoursPerDay) ? hoursPerDay : 0;
  const safeDays = Number.isFinite(daysPerYear) ? daysPerYear : 0;
  const safePrice = Number.isFinite(price) ? price : 0;

  const dailyKWh = (safeWatt * safeHours) / 1000;
  const monthlyKWh = dailyKWh * 30;
  const annualKWh = dailyKWh * safeDays;
  const dailyCost = dailyKWh * safePrice;
  const monthlyCost = monthlyKWh * safePrice;
  const annualCost = annualKWh * safePrice;

  const en = locale === "en";
  const daysLabel = en ? "days" : "天";

  return {
    dailyKWh,
    monthlyKWh,
    annualKWh,
    dailyCost,
    monthlyCost,
    annualCost,
    formula: en
      ? "kWh = W ÷ 1000 × hours per day × days"
      : "kWh = W ÷ 1000 × 每天小时数 × 天数",
    directAnswer: `${formatNumber(safeWatt, 6)}W × ${formatNumber(safeHours, 6)}h × ${formatNumber(safeDays, 6)} ${daysLabel}`,
    realityNote: en
      ? "W is power, kWh is energy. Electricity is billed per kWh, not per W. Monthly estimates use 30 days."
      : "W 是功率，kWh 是电量。电费按 kWh 计，不是按 W 计；月度这里按 30 天粗算。",
  };
}

export function clampNumber(value: number, fallback: number = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function toPositiveNumber(value: number, fallback: number = 0): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export function storagePrefixLabel(prefixIndex: number): string {
  return STORAGE_PREFIXES[prefixIndex] ?? "";
}

export function storageBinaryPrefixLabel(prefixIndex: number): string {
  return STORAGE_BINARY_PREFIXES[prefixIndex] ?? "";
}
