import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { THEME_ATTRIBUTE } from '@toolbox/theme/contract';
import type { ResolvedTheme, ThemeMode } from '../i18n';
import {
  getSystemTheme,
  readStoredTheme,
  writeResolvedTheme,
  writeStoredThemeMode,
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
    // The mode (including 'system') stays in the app-private namespace.
    writeStoredThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    // The shared contract key only ever carries the resolved value; writing
    // it here also completes the one-time migration of overloaded entries.
    writeResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
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
