import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ResolvedTheme, ThemeMode } from '../i18n';
import {
  THEME_STORAGE_KEY,
  getSystemTheme,
  readStoredTheme,
  PreferencesContext,
  type PreferencesContextValue,
} from './preferencesCore';

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolvedTheme: ResolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((current) => {
      if (current === 'system') {
        return systemTheme === 'dark' ? 'light' : 'dark';
      }
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemTheme]);

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      themeMode,
      resolvedTheme,
      toggleTheme,
      setThemeMode,
    };
  }, [themeMode, resolvedTheme, toggleTheme, setThemeMode]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};
