import { getLang, intlLocale } from "@toolbox/i18n/core";

type StorageUnitValue =
  | "B" | "KB" | "KiB" | "MB" | "MiB" | "GB" | "GiB" | "TB" | "TiB" | "PB" | "PiB";

type NetworkBandwidthUnit = "Kbps" | "Mbps" | "Gbps" | "KB/s" | "MB/s" | "MiB/s" | "GB/s";
type NetworkSizeUnit = "MB" | "MiB" | "GB" | "GiB" | "TB" | "TiB";
type VideoBitrateUnit = "Kbps" | "Mbps" | "Gbps" | "KB/s" | "MB/s" | "MiB/s";
type VideoDurationUnit = "s" | "min" | "h";
type VideoSizeUnit = "MB" | "MiB" | "GB" | "GiB" | "TB" | "TiB";
type CurrencyValue = "CNY" | "USD" | "EUR";
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

interface PowerPreset {
  label: string;
  watt: number;
}

interface VideoPreset {
  label: string;
  labelKey?: string;
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

export const STORAGE_SCENARIOS: { value: string }[] = [
  { value: "drive" },
  { value: "os" },
  { value: "memory" },
  { value: "file" },
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

export const NETWORK_SCENARIOS: { value: string; efficiency: number }[] = [
  { value: "wired-lan", efficiency: 95 },
  { value: "wifi", efficiency: 90 },
  { value: "public", efficiency: 80 },
  { value: "vps", efficiency: 80 },
  { value: "vpn", efficiency: 70 },
  { value: "crossborder", efficiency: 50 },
  { value: "custom", efficiency: 85 },
];

export const POWER_CURRENCY_OPTIONS: { value: CurrencyValue }[] = [
  { value: "CNY" },
  { value: "USD" },
  { value: "EUR" },
];

export const POWER_PRESETS: PowerPreset[] = [
  { label: "5W", watt: 5 },
  { label: "30W", watt: 30 },
  { label: "100W", watt: 100 },
  { label: "300W", watt: 300 },
];

export const VIDEO_TARGET_OPTIONS: { value: VideoMode }[] = [
  { value: "size" },
  { value: "duration" },
  { value: "bitrate" },
];

export const VIDEO_BITRATE_OPTIONS: SelectOption<VideoBitrateUnit>[] = [
  { value: "Kbps", label: "Kbps" },
  { value: "Mbps", label: "Mbps" },
  { value: "Gbps", label: "Gbps" },
  { value: "KB/s", label: "KB/s" },
  { value: "MB/s", label: "MB/s" },
  { value: "MiB/s", label: "MiB/s" },
];

export const VIDEO_DURATION_OPTIONS: { value: VideoDurationUnit }[] = [
  { value: "s" },
  { value: "min" },
  { value: "h" },
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
    label: "surveillance-24h",
    labelKey: "video.presetLabels.surveillance24h",
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

function currentNumberLocale(): string {
  return intlLocale(getLang());
}

export function formatNumber(value: number, digits: number = 2): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(currentNumberLocale(), {
    maximumFractionDigits: digits,
  }).format(safeValue);
}

export function formatInteger(value: number): string {
  return formatNumber(Math.round(value), 0);
}

export function formatBytes(bytes: number): string {
  return new Intl.NumberFormat(currentNumberLocale(), {
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

export interface DurationWords {
  approx: string;
  hr: string;
  min: string;
  sec: string;
}

export function formatDuration(seconds: number, words: DurationWords): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} ${words.hr}`);
  if (hours > 0 || minutes > 0) parts.push(`${minutes} ${words.min}`);
  if (hours === 0 && minutes === 0) parts.push(`${secs} ${words.sec}`);

  return `${words.approx} ${parts.join(" ")}`;
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
  decimalBytes: number;
  binaryEquivalentBytes: number;
  differencePercent: number;
}

export function calculateStorage(value: number, unit: string): StorageResult {
  const safeValue = Number.isFinite(value) ? value : 0;
  const spec = getStorageSpec(unit);
  const exactBytes = safeValue * storageMultiplier(unit);
  const decimalBytes = safeValue * spec.decimalMultiplier;
  const binaryEquivalentBytes = safeValue * spec.binaryMultiplier;
  const differencePercent = decimalBytes === 0
    ? 0
    : Math.abs((binaryEquivalentBytes - decimalBytes) / decimalBytes) * 100;

  return {
    exactBytes,
    decimalBytes,
    binaryEquivalentBytes,
    differencePercent,
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
  return map[unit as NetworkBandwidthUnit] ?? map.Mbps;
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
  return map[unit as VideoDurationUnit] ?? map.s;
}

export function formatBitrate(bps: number): string {
  const abs = Math.abs(bps);
  if (abs >= 1000 ** 3) return `${formatNumber(bps / 1000 ** 3, 2)} Gbps`;
  if (abs >= 1000 ** 2) return `${formatNumber(bps / 1000 ** 2, 2)} Mbps`;
  if (abs >= 1000) return `${formatNumber(bps / 1000, 2)} Kbps`;
  return `${formatNumber(bps, 0)} bps`;
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
  return safeValue * (map[unit as VideoBitrateUnit] ?? map.Mbps);
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
}

export interface VideoResult {
  mode: VideoMode;
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
  clampedToZero: boolean;
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
  let clampedToZero = false;

  if (safeMode === "size") {
    solvedSizeBytes = (totalBitrateWithOverhead * durationSeconds) / 8;
  } else if (safeMode === "duration") {
    solvedDurationSeconds = totalBps > 0 ? (sizeBytes * 8) / totalBitrateWithOverhead : 0;
  } else if (safeMode === "bitrate") {
    solvedBitrateBps = durationSeconds > 0 ? sizeBytes * 8 / (durationSeconds * overheadFactor) - audioBps : 0;
    if (solvedBitrateBps < 0) {
      clampedToZero = true;
      solvedBitrateBps = 0;
    }
  }

  return {
    mode: safeMode,
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
    clampedToZero,
    overheadFactor,
  };
}

export interface NetworkInput {
  bandwidthValue: number;
  bandwidthUnit: string;
  sizeValue: number;
  sizeUnit: string;
  efficiency: number;
}

export interface NetworkResult {
  bandwidthBps: number;
  bytesPerSecond: number;
  theoreticalMBps: number;
  theoreticalMiBps: number;
  sizeBytes: number;
  theoreticalSeconds: number;
  effectiveSeconds: number;
  efficiency: number;
}

export function calculateNetwork({
  bandwidthValue,
  bandwidthUnit,
  sizeValue,
  sizeUnit,
  efficiency,
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

  return {
    bandwidthBps: bps,
    bytesPerSecond,
    theoreticalMBps,
    theoreticalMiBps,
    sizeBytes,
    theoreticalSeconds,
    effectiveSeconds,
    efficiency: safeEfficiency,
  };
}

export interface PowerInput {
  watt: number;
  hoursPerDay: number;
  daysPerYear: number;
  price: number;
}

export interface PowerResult {
  dailyKWh: number;
  monthlyKWh: number;
  annualKWh: number;
  dailyCost: number;
  monthlyCost: number;
  annualCost: number;
}

export function calculatePower({ watt, hoursPerDay, daysPerYear, price }: PowerInput): PowerResult {
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

  return {
    dailyKWh,
    monthlyKWh,
    annualKWh,
    dailyCost,
    monthlyCost,
    annualCost,
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

// Shared network scenario presets (view-layer defaults kept beside the
// other option tables).
export const NETWORK_PRESETS = [
  {
    label: "1TiB / 1000Mbps",
    bandwidthValue: 1000,
    bandwidthUnit: "Mbps",
    sizeValue: 1,
    sizeUnit: "TiB",
    scenario: "wired-lan",
    efficiency: 85,
  },
  {
    label: "100GB / 1000Mbps",
    bandwidthValue: 1000,
    bandwidthUnit: "Mbps",
    sizeValue: 100,
    sizeUnit: "GB",
    scenario: "wired-lan",
    efficiency: 90,
  },
  {
    label: "1TB / 2.5Gbps",
    bandwidthValue: 2.5,
    bandwidthUnit: "Gbps",
    sizeValue: 1,
    sizeUnit: "TB",
    scenario: "wired-lan",
    efficiency: 95,
  },
  {
    label: "100GB / VPN",
    bandwidthValue: 500,
    bandwidthUnit: "Mbps",
    sizeValue: 100,
    sizeUnit: "GB",
    scenario: "vpn",
    efficiency: 70,
  },
];
