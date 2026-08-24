import { createContext } from 'react';
import {
  DEFAULT_THEME,
  isTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
} from '@toolbox/theme/contract';
import type { ResolvedTheme } from '../i18n';

export { THEME_ATTRIBUTE, THEME_STORAGE_KEY };

export interface PreferencesContextValue {
  resolvedTheme: ResolvedTheme;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/** Pre-contract key kept as a one-time migration source. */
export const LEGACY_THEME_STORAGE_KEY = 'chrono-sphere.theme';

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // localStorage may be unavailable (private mode / SSR); ignore.
    return null;
  }
}

/**
 * Resolve the OS-level color scheme preference. Falls back to 'dark' when
 * window or matchMedia is unavailable (SSR).
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Read the active theme. The shared contract key written by the Settings
 * app is authoritative; the legacy pre-contract key is honored once for
 * existing visitors; otherwise the app follows the OS preference.
 */
export function readStoredTheme(): ResolvedTheme {
  const shared = readStorage(THEME_STORAGE_KEY);
  if (isTheme(shared)) return shared;
  const legacy = readStorage(LEGACY_THEME_STORAGE_KEY);
  if (isTheme(legacy)) return legacy;
  return getSystemTheme();
}

/** True when the visitor has an explicit stored choice (shared or legacy). */
export function hasExplicitThemeChoice(): boolean {
  return isTheme(readStorage(THEME_STORAGE_KEY)) || isTheme(readStorage(LEGACY_THEME_STORAGE_KEY));
}
