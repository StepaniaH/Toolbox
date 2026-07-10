import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "saneunits.theme";

export interface UseThemeResult {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeResult {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light") return false;
      if (stored === "dark") return true;
    } catch {
      // Ignore storage failures.
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures.
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((prev) => !prev), []);

  return { theme: isDark ? "dark" : "light", setTheme: (t: ThemeMode) => setIsDark(t === "dark"), isDark, toggleTheme };
}
