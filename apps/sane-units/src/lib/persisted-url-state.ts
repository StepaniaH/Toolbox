import { useEffect, useState } from "react";
import {
  NETWORK_SCENARIOS,
  NETWORK_SIZE_OPTIONS,
  NETWORK_UNIT_OPTIONS,
  POWER_CURRENCY_OPTIONS,
  VIDEO_BITRATE_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  VIDEO_SIZE_OPTIONS,
  VIDEO_TARGET_OPTIONS,
  STORAGE_SCENARIOS,
  STORAGE_UNIT_OPTIONS,
} from "./units";
import { toAppPath } from "./router";
import { readStoredState, writeStoredState } from "./storage";

export const STORAGE_DEFAULTS = {
  value: 4,
  unit: "TB",
  scenario: "drive",
  preset: "4TB",
};

export const NETWORK_DEFAULTS = {
  bandwidthValue: 1000,
  bandwidthUnit: "Mbps",
  sizeValue: 1,
  sizeUnit: "TiB",
  scenario: "wired-lan",
  efficiency: 85,
  preset: "1TiB-1000Mbps",
};

export const VIDEO_DEFAULTS = {
  mode: "size",
  bitrateValue: 8,
  bitrateUnit: "Mbps",
  durationValue: 1,
  durationUnit: "h",
  sizeValue: 1,
  sizeUnit: "GB",
  audioBitrateValue: 128,
  audioBitrateUnit: "Kbps",
  overheadPercent: 1,
  preset: "8Mbps / 1h",
};

export const POWER_DEFAULTS = {
  watt: 30,
  hoursPerDay: 24,
  daysPerYear: 365,
  price: 0.56,
  currency: "CNY",
  preset: "30W",
};


/** Parse a query value into a finite number, falling back when invalid. */
export function parseNumber(value: string | null, fallback: number = Number.NaN): number {
  if (value === null || value === "") return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}


export function useSyncedState(
  storageKey: string,
  legacyStorageKey: string,
  defaults: any,
  pathname: string,
  decode: (params: URLSearchParams) => any,
  encode: (state: any) => string,
): [any, React.Dispatch<React.SetStateAction<any>>] {
  const [state, setState] = useState(() => {
    const fromQuery = decode(new URLSearchParams(window.location.search));
    const fromStorage = readStoredState(storageKey, legacyStorageKey);
    return {
      ...defaults,
      ...fromStorage,
      ...fromQuery,
    };
  });

  useEffect(() => {
    writeStoredState(storageKey, state);
    const query = encode(state);
    const publicPath = toAppPath(pathname);
    const nextUrl = query ? `${publicPath}?${query}` : publicPath;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [state, storageKey, pathname, encode]);

  return [state, setState];
}


export function decodeStorageState(params: URLSearchParams) {
  const value = parseNumber(params.get("value"));
  const unit = params.get("unit");
  const scenario = params.get("scenario");
  const preset = params.get("preset");

  return {
    value: Number.isFinite(value) ? value : STORAGE_DEFAULTS.value,
    unit: STORAGE_UNIT_OPTIONS.some((item) => item.value === unit) ? unit : STORAGE_DEFAULTS.unit,
    scenario: STORAGE_SCENARIOS.some((item) => item.value === scenario) ? scenario : STORAGE_DEFAULTS.scenario,
    preset: preset ?? STORAGE_DEFAULTS.preset,
  };
}

export function encodeStorageState(state: any): string {
  const params = new URLSearchParams();
  params.set("value", String(state.value));
  params.set("unit", state.unit);
  params.set("scenario", state.scenario);
  return params.toString();
}

export function decodeNetworkState(params: URLSearchParams) {
  const bandwidthValue = parseNumber(params.get("bandwidthValue"));
  const bandwidthUnit = params.get("bandwidthUnit");
  const sizeValue = parseNumber(params.get("sizeValue"));
  const sizeUnit = params.get("sizeUnit");
  const scenario = params.get("scenario");
  const efficiency = parseNumber(params.get("efficiency"));
  const preset = params.get("preset");

  return {
    bandwidthValue: Number.isFinite(bandwidthValue) ? bandwidthValue : NETWORK_DEFAULTS.bandwidthValue,
    bandwidthUnit: NETWORK_UNIT_OPTIONS.some((item) => item.value === bandwidthUnit) ? bandwidthUnit : NETWORK_DEFAULTS.bandwidthUnit,
    sizeValue: Number.isFinite(sizeValue) ? sizeValue : NETWORK_DEFAULTS.sizeValue,
    sizeUnit: NETWORK_SIZE_OPTIONS.some((item) => item.value === sizeUnit) ? sizeUnit : NETWORK_DEFAULTS.sizeUnit,
    scenario: NETWORK_SCENARIOS.some((item) => item.value === scenario) ? scenario : NETWORK_DEFAULTS.scenario,
    efficiency: Number.isFinite(efficiency) ? efficiency : NETWORK_DEFAULTS.efficiency,
    preset: preset ?? NETWORK_DEFAULTS.preset,
  };
}

export function encodeNetworkState(state: any): string {
  const params = new URLSearchParams();
  params.set("bandwidthValue", String(state.bandwidthValue));
  params.set("bandwidthUnit", state.bandwidthUnit);
  params.set("sizeValue", String(state.sizeValue));
  params.set("sizeUnit", state.sizeUnit);
  params.set("scenario", state.scenario);
  params.set("efficiency", String(state.efficiency));
  return params.toString();
}

export function decodePowerState(params: URLSearchParams) {
  const watt = parseNumber(params.get("watt"));
  const hoursPerDay = parseNumber(params.get("hours"));
  const daysPerYear = parseNumber(params.get("days"));
  const price = parseNumber(params.get("price"));
  const currency = params.get("currency");
  const preset = params.get("preset");

  return {
    watt: Number.isFinite(watt) ? watt : POWER_DEFAULTS.watt,
    hoursPerDay: Number.isFinite(hoursPerDay) ? hoursPerDay : POWER_DEFAULTS.hoursPerDay,
    daysPerYear: Number.isFinite(daysPerYear) ? daysPerYear : POWER_DEFAULTS.daysPerYear,
    price: Number.isFinite(price) ? price : POWER_DEFAULTS.price,
    currency: POWER_CURRENCY_OPTIONS.some((item) => item.value === currency) ? currency : POWER_DEFAULTS.currency,
    preset: preset ?? POWER_DEFAULTS.preset,
  };
}

export function encodePowerState(state: any): string {
  const params = new URLSearchParams();
  params.set("watt", String(state.watt));
  params.set("hours", String(state.hoursPerDay));
  params.set("days", String(state.daysPerYear));
  params.set("price", String(state.price));
  params.set("currency", state.currency);
  return params.toString();
}

export function decodeVideoState(params: URLSearchParams) {
  const mode = params.get("mode");
  const bitrateValue = parseNumber(params.get("bitrateValue"));
  const bitrateUnit = params.get("bitrateUnit");
  const durationValue = parseNumber(params.get("durationValue"));
  const durationUnit = params.get("durationUnit");
  const sizeValue = parseNumber(params.get("sizeValue"));
  const sizeUnit = params.get("sizeUnit");
  const audioBitrateValue = parseNumber(params.get("audioBitrateValue"));
  const audioBitrateUnit = params.get("audioBitrateUnit");
  const overheadPercent = parseNumber(params.get("overhead"));
  const preset = params.get("preset");

  return {
    mode: VIDEO_TARGET_OPTIONS.some((item) => item.value === mode) ? mode : VIDEO_DEFAULTS.mode,
    bitrateValue: Number.isFinite(bitrateValue) ? bitrateValue : VIDEO_DEFAULTS.bitrateValue,
    bitrateUnit: VIDEO_BITRATE_OPTIONS.some((item) => item.value === bitrateUnit) ? bitrateUnit : VIDEO_DEFAULTS.bitrateUnit,
    durationValue: Number.isFinite(durationValue) ? durationValue : VIDEO_DEFAULTS.durationValue,
    durationUnit: VIDEO_DURATION_OPTIONS.some((item) => item.value === durationUnit) ? durationUnit : VIDEO_DEFAULTS.durationUnit,
    sizeValue: Number.isFinite(sizeValue) ? sizeValue : VIDEO_DEFAULTS.sizeValue,
    sizeUnit: VIDEO_SIZE_OPTIONS.some((item) => item.value === sizeUnit) ? sizeUnit : VIDEO_DEFAULTS.sizeUnit,
    audioBitrateValue: Number.isFinite(audioBitrateValue) ? audioBitrateValue : VIDEO_DEFAULTS.audioBitrateValue,
    audioBitrateUnit: VIDEO_BITRATE_OPTIONS.some((item) => item.value === audioBitrateUnit) ? audioBitrateUnit : VIDEO_DEFAULTS.audioBitrateUnit,
    overheadPercent: Number.isFinite(overheadPercent) ? overheadPercent : VIDEO_DEFAULTS.overheadPercent,
    preset: preset ?? VIDEO_DEFAULTS.preset,
  };
}

export function encodeVideoState(state: any): string {
  const params = new URLSearchParams();
  params.set("mode", state.mode);
  params.set("bitrateValue", String(state.bitrateValue));
  params.set("bitrateUnit", state.bitrateUnit);
  params.set("durationValue", String(state.durationValue));
  params.set("durationUnit", state.durationUnit);
  params.set("sizeValue", String(state.sizeValue));
  params.set("sizeUnit", state.sizeUnit);
  params.set("audioBitrateValue", String(state.audioBitrateValue));
  params.set("audioBitrateUnit", state.audioBitrateUnit);
  params.set("overhead", String(state.overheadPercent));
  return params.toString();
}


export function buildShareUrl(pathname: string, state: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  const publicPath = toAppPath(pathname);
  return `${publicPath}${query ? `?${query}` : ""}`;
}
