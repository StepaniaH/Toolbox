// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  THEME_ATTRIBUTE,
  THEME_CONTRACT_VERSION,
  THEME_STORAGE_KEY,
} from "@toolbox/theme/contract";

const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
const styleSource = readFileSync(resolve("src/styles.css"), "utf8");

describe("SaneUnits shared theme storage", () => {
  it("consumes the shared v1 theme contract", () => {
    expect(THEME_CONTRACT_VERSION).toBe(2);
    expect(THEME_STORAGE_KEY).toBe("toolbox-theme");
    expect(THEME_ATTRIBUTE).toBe("data-theme");
  });

  it("loads the shared theme stylesheet before app layout styles", () => {
    const sharedThemeImport = mainSource.indexOf('import "@toolbox/theme/styles.css"');
    const appStyleImport = mainSource.indexOf('import "./styles.css"');

    expect(sharedThemeImport).toBeGreaterThanOrEqual(0);
    expect(appStyleImport).toBeGreaterThan(sharedThemeImport);
  });

  it("derives app surfaces from shared semantic tokens", () => {
    expect(styleSource).not.toMatch(/#[\da-f]{3,8}\b/i);
    expect(styleSource).not.toMatch(/^\s*--(?:ctp|color)-[\w-]+\s*:/m);
    expect(styleSource).toContain("var(--color-bg)");
    expect(styleSource).toContain("var(--color-border)");
    expect(styleSource).toContain("var(--color-text)");
    expect(styleSource).toContain("var(--font-sans)");
    expect(styleSource).toContain("var(--radius-sm)");
  });
});
