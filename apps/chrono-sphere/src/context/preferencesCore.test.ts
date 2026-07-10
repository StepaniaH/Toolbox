import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  readStoredTheme,
  getSystemTheme,
  THEME_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  PreferencesContext,
} from './preferencesCore';

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeLocalStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

function makeMatchMedia(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}

/** Stub a browser-like `window` with the given localStorage contents and system theme. */
function stubWindow(localStorageInitial: Record<string, string> = {}, systemIsDark = false) {
  vi.stubGlobal('window', {
    localStorage: makeLocalStorage(localStorageInitial),
    matchMedia: () => makeMatchMedia(systemIsDark),
  });
}

describe('PreferencesContext', () => {
  it('is a defined React context object with a Provider', () => {
    expect(PreferencesContext).toBeDefined();
    expect(PreferencesContext).toHaveProperty('Provider');
    expect(typeof PreferencesContext.Provider).toBe('object');
  });
});

describe('readStoredTheme — 主题偏好存储/读取 (dark/light/system)', () => {
  it('returns "light" when "light" is persisted', () => {
    stubWindow({ [THEME_STORAGE_KEY]: 'light' });
    expect(readStoredTheme()).toBe('light');
  });

  it('returns "dark" when "dark" is persisted', () => {
    stubWindow({ [THEME_STORAGE_KEY]: 'dark' });
    expect(readStoredTheme()).toBe('dark');
  });

  it('returns "system" when "system" is persisted', () => {
    stubWindow({ [THEME_STORAGE_KEY]: 'system' });
    expect(readStoredTheme()).toBe('system');
  });

  it('returns "system" default when nothing is persisted', () => {
    stubWindow({});
    expect(readStoredTheme()).toBe('system');
  });

  it('returns "system" default in SSR (window undefined)', () => {
    expect(readStoredTheme()).toBe('system');
  });

  it('falls back to the legacy app theme key during migration', () => {
    stubWindow({ [LEGACY_THEME_STORAGE_KEY]: 'light' });
    expect(readStoredTheme()).toBe('light');
  });
});

describe('readStoredTheme — 无效存储值回退逻辑', () => {
  it.each([
    ['unknown theme "blue"', 'blue'],
    ['empty string', ''],
    ['uppercase "Dark"', 'Dark'],
    ['theme with whitespace', ' dark '],
    ['numeric string "0"', '0'],
  ])('falls back to "system" for %s', (_label, stored) => {
    stubWindow({ [THEME_STORAGE_KEY]: stored });
    expect(readStoredTheme()).toBe('system');
  });
});

describe('getSystemTheme — 系统主题解析', () => {
  it('returns "dark" when the OS prefers dark', () => {
    stubWindow({}, true);
    expect(getSystemTheme()).toBe('dark');
  });

  it('returns "light" when the OS prefers light', () => {
    stubWindow({}, false);
    expect(getSystemTheme()).toBe('light');
  });

  it('returns "dark" default in SSR (window undefined)', () => {
    expect(getSystemTheme()).toBe('dark');
  });
});

describe('storage key stability', () => {
  it('exposes a stable, namespaced theme storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('toolbox-theme');
    expect(LEGACY_THEME_STORAGE_KEY).toBe('chrono-sphere.theme');
  });
});
