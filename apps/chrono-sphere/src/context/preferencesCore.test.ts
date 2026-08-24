import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_CONTRACT_VERSION,
  THEME_STORAGE_KEY as CONTRACT_THEME_STORAGE_KEY,
} from '@toolbox/theme/contract';
import {
  readStoredTheme,
  writeResolvedTheme,
  writeStoredThemeMode,
  getSystemTheme,
  THEME_MODE_STORAGE_KEY,
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

describe('readStoredTheme — 私有键模式与一次性迁移 (dark/light/system)', () => {
  it('reads the mode from the app-private key first', () => {
    stubWindow({
      [THEME_MODE_STORAGE_KEY]: 'system',
      [THEME_STORAGE_KEY]: 'dark',
    });
    expect(readStoredTheme()).toBe('system');
  });

  it('returns explicit dark/light persisted in the private key', () => {
    stubWindow({ [THEME_MODE_STORAGE_KEY]: 'light' });
    expect(readStoredTheme()).toBe('light');
  });

  it('migrates an overloaded shared key entry as one-time input', () => {
    stubWindow({ [THEME_STORAGE_KEY]: 'system' });
    expect(readStoredTheme()).toBe('system');

    stubWindow({ [THEME_STORAGE_KEY]: 'dark' });
    expect(readStoredTheme()).toBe('dark');
  });

  it('falls back to the legacy app theme key during migration', () => {
    stubWindow({ [LEGACY_THEME_STORAGE_KEY]: 'light' });
    expect(readStoredTheme()).toBe('light');
  });

  it('returns "system" default when nothing is persisted', () => {
    stubWindow({});
    expect(readStoredTheme()).toBe('system');
  });

  it('returns "system" default in SSR (window undefined)', () => {
    expect(readStoredTheme()).toBe('system');
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

describe('writeStoredThemeMode / writeResolvedTheme — 契约写入边界', () => {
  it('stores modes only under the private key', () => {
    const storage = makeLocalStorage({});
    vi.stubGlobal('window', { localStorage: storage });
    writeStoredThemeMode('system');
    expect(storage.getItem(THEME_MODE_STORAGE_KEY)).toBe('system');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('stores resolved values only under the shared contract key', () => {
    const storage = makeLocalStorage({ [THEME_STORAGE_KEY]: 'system' });
    vi.stubGlobal('window', { localStorage: storage });
    writeResolvedTheme('light');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(storage.getItem(LEGACY_THEME_STORAGE_KEY)).toBeNull();
  });

  it('survives storage failures without throwing', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('unavailable');
        },
        setItem: () => {
          throw new Error('unavailable');
        },
      } as unknown as Storage,
    });
    expect(readStoredTheme()).toBe('system');
    expect(() => writeStoredThemeMode('dark')).not.toThrow();
    expect(() => writeResolvedTheme('dark')).not.toThrow();
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
  it('consumes the shared v1 theme contract without changing legacy fallback', () => {
    expect(THEME_CONTRACT_VERSION).toBe(2);
    expect(THEME_STORAGE_KEY).toBe(CONTRACT_THEME_STORAGE_KEY);
    expect(DEFAULT_THEME).toBe('dark');
    expect(THEME_ATTRIBUTE).toBe('data-theme');
    expect(LEGACY_THEME_STORAGE_KEY).toBe('chrono-sphere.theme');
    expect(THEME_MODE_STORAGE_KEY).toBe('toolbox.chrono-sphere.theme-mode');
  });
});
