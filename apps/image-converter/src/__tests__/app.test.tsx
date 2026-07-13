import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../App";
import { translations } from "../i18n";

afterEach(() => { cleanup(); localStorage.clear(); });

function leaves(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, next]) => leaves(next, prefix ? `${prefix}.${key}` : key));
}

describe("application shell", () => {
  it("keeps Chinese and English translation keys aligned", () => {
    expect(leaves(translations.zh).sort()).toEqual(leaves(translations.en).sort());
  });

  it("recovers from corrupt persisted settings and renders one shared shell", () => {
    localStorage.setItem("toolbox.image-converter.settings", "{bad-json");
    const { container } = render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(container.querySelectorAll(".toolbox-nav")).toHaveLength(1);
    expect(container.querySelectorAll(".toolbox-footer")).toHaveLength(1);
    expect((screen.getByRole("button", { name: /Convert images|开始转换/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
