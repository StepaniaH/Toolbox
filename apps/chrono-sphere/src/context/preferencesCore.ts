import { createContext } from 'react';
import {
  DEFAULT_THEME,
  isTheme,
  THEME_STORAGE_KEY,
} from '@toolbox/theme/contract';
import type { ResolvedTheme, ThemeMode } from '../i18n';

export { THEME_STORAGE_KEY };

export interface PreferencesContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * App-private key holding the full theme mode, including 'system'.
 * The shared toolbox-theme key only ever stores resolved dark|light
 * values so other apps can consume it safely (see docs/PLAN.md ADR-12).
 */
export const THEME_MODE_STORAGE_KEY = 'toolbox.chrono-sphere.theme-mode';

/** Pre-contract key kept as a read-only migration source. */
export const LEGACY_THEME_STORAGE_KEY = 'chrono-sphere.theme';

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'system' || isTheme(value);
}

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
 * Read the persisted theme mode. Modes live in the app-private namespace;
 * a valid mode found under the shared key or the legacy key is treated as
 * one-time migration input and is rewritten to the right place by the
 * provider's persistence effects.
 */
export function readStoredTheme(): ThemeMode {
  const own = readStorage(THEME_MODE_STORAGE_KEY);
  if (isThemeMode(own)) return own;
  const previous =
    readStorage(THEME_STORAGE_KEY) ?? readStorage(LEGACY_THEME_STORAGE_KEY);
  return isThemeMode(previous) ? previous : 'system';
}

export function writeStoredThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // Persistence failures must not break theme application.
  }
}

export function writeResolvedTheme(theme: ResolvedTheme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Persistence failures must not break theme application.
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
