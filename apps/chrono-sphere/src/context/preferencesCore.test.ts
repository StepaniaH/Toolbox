import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_CONTRACT_VERSION,
  THEME_STORAGE_KEY as CONTRACT_THEME_STORAGE_KEY,
} from '@toolbox/theme/contract';
import {
  readStoredTheme,
  hasExplicitThemeChoice,
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

describe('readStoredTheme — 共享键优先，遗留键一次性迁移', () => {
  it('reads the explicit choice from the shared Settings key first', () => {
    stubWindow({
      [THEME_STORAGE_KEY]: 'dark',
      [LEGACY_THEME_STORAGE_KEY]: 'light',
    });
    expect(readStoredTheme()).toBe('dark');
    expect(hasExplicitThemeChoice()).toBe(true);
  });

  it('honors the legacy key only while the shared key is unset', () => {
    stubWindow({ [LEGACY_THEME_STORAGE_KEY]: 'light' });
    expect(readStoredTheme()).toBe('light');
    expect(hasExplicitThemeChoice()).toBe(true);
  });

  it('follows the OS preference when nothing is persisted', () => {
    stubWindow({}, true);
    expect(readStoredTheme()).toBe('dark');
    expect(hasExplicitThemeChoice()).toBe(false);
  });

  it('falls back to the system preference in SSR (window undefined)', () => {
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
    expect(hasExplicitThemeChoice()).toBe(false);
  });
});

describe('readStoredTheme — 无效存储值回退逻辑', () => {
  it.each([
    ['unknown theme "blue"', 'blue'],
    ['empty string', ''],
    ['uppercase "Dark"', 'Dark'],
    ['theme with whitespace', ' dark '],
    ['numeric string "0"', '0'],
  ])('ignores %s and follows the OS preference', (_label, stored) => {
    stubWindow({ [THEME_STORAGE_KEY]: stored }, true);
    expect(readStoredTheme()).toBe('dark');
    expect(hasExplicitThemeChoice()).toBe(false);
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
  it('consumes the shared v2 theme contract without changing legacy fallback', () => {
    expect(THEME_CONTRACT_VERSION).toBe(2);
    expect(THEME_STORAGE_KEY).toBe(CONTRACT_THEME_STORAGE_KEY);
    expect(THEME_ATTRIBUTE).toBe('data-theme');
    expect(LEGACY_THEME_STORAGE_KEY).toBe('chrono-sphere.theme');
  });
});
