import React, { useEffect, useMemo, useState } from 'react';
import type { ResolvedTheme } from '../i18n';
import {
  hasExplicitThemeChoice,
  readStoredTheme,
  PreferencesContext,
  THEME_ATTRIBUTE,
  type PreferencesContextValue,
} from './preferencesCore';

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(readStoredTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Follow OS changes only while the visitor has not stored an explicit
    // choice in the shared key managed by the Settings app.
    if (hasExplicitThemeChoice()) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setResolvedTheme(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo<PreferencesContextValue>(() => {
    return { resolvedTheme };
  }, [resolvedTheme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};
