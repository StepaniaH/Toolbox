export const STATE_STORAGE_KEYS = Object.freeze({
  storage: "toolbox.sane-units.storage",
  network: "toolbox.sane-units.network",
  power: "toolbox.sane-units.power",
  video: "toolbox.sane-units.video",
});

export const LEGACY_STATE_STORAGE_KEYS = Object.freeze({
  storage: "saneunits.storage",
  network: "saneunits.network",
  power: "saneunits.power",
  video: "saneunits.video",
});

export function readStoredState<T>(key: string, legacyKey: string): T | null {
  try {
    const raw = globalThis.localStorage.getItem(key)
      ?? globalThis.localStorage.getItem(legacyKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStoredState<T>(key: string, value: T): void {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
}
