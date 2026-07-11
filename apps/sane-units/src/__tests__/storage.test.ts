import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_STATE_STORAGE_KEYS,
  STATE_STORAGE_KEYS,
  readStoredState,
  writeStoredState,
} from "../lib/storage";

describe("SaneUnits storage namespace", () => {
  beforeEach(() => localStorage.clear());

  it("uses the app-private toolbox namespace", () => {
    expect(Object.values(STATE_STORAGE_KEYS).every((key) => key.startsWith("toolbox.sane-units."))).toBe(true);
  });

  it("reads legacy state only when the new key is absent", () => {
    localStorage.setItem(LEGACY_STATE_STORAGE_KEYS.storage, JSON.stringify({ value: 8 }));
    expect(readStoredState(STATE_STORAGE_KEYS.storage, LEGACY_STATE_STORAGE_KEYS.storage)).toEqual({ value: 8 });

    localStorage.setItem(STATE_STORAGE_KEYS.storage, JSON.stringify({ value: 4 }));
    expect(readStoredState(STATE_STORAGE_KEYS.storage, LEGACY_STATE_STORAGE_KEYS.storage)).toEqual({ value: 4 });
  });

  it("writes only the new namespaced key", () => {
    writeStoredState(STATE_STORAGE_KEYS.network, { efficiency: 85 });
    expect(localStorage.getItem(STATE_STORAGE_KEYS.network)).toBe('{"efficiency":85}');
    expect(localStorage.getItem(LEGACY_STATE_STORAGE_KEYS.network)).toBeNull();
  });
});
