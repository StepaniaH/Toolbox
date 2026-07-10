import { useState, useEffect, useCallback } from "react";
import {
  isTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
} from "@toolbox/theme/contract";
import type { ToolboxTheme } from "@toolbox/theme/contract";

export type ThemeMode = ToolboxTheme;

export { THEME_STORAGE_KEY };
export const LEGACY_THEME_STORAGE_KEY = "saneunits.theme";

export interface UseThemeResult {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeResult {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
        ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
      if (isTheme(stored)) return stored === "dark";
    } catch {
      // Ignore storage failures.
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures.
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((prev) => !prev), []);

  return { theme: isDark ? "dark" : "light", setTheme: (t: ThemeMode) => setIsDark(t === "dark"), isDark, toggleTheme };
}
