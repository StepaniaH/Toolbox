import { createContext } from 'react';
import type { ResolvedTheme, ThemeMode } from '../i18n';

export interface PreferencesContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export const THEME_STORAGE_KEY = 'chrono-sphere.theme';

/**
 * Read persisted theme mode from localStorage. Falls back to 'system' when
 * window is unavailable (SSR) or the stored value is not a valid theme mode.
 */
export function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

/**
 * Resolve the OS-level color scheme preference. Falls back to 'dark' when
 * window or matchMedia is unavailable (SSR).
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
