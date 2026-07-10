// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  useTheme,
} from "../lib/theme";

describe("SaneUnits shared theme storage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("migrates the legacy theme preference to the shared key", async () => {
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    await waitFor(() => expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light"));
  });

  it("prefers the shared theme key over the legacy value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });
});
