import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("FormTran");
    expect(container.querySelectorAll(".toolbox-nav")).toHaveLength(1);
    expect(container.querySelectorAll(".toolbox-footer")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /Drop a file|把文件拖进来/ })).toBeTruthy();
  });

  it("exposes a file home plus four independent workspaces", () => {
    render(<App />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    fireEvent.click(tabs[4]);
    expect(tabs[4].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").id).toBe("panel-knowledge");
    expect(screen.getByText(/Knowledge base privacy|知识库隐私说明/)).toBeTruthy();
  });

  it("uses an accessible theme-native format menu", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("tab")[3]);
    expect(screen.getByRole("heading", { name: /Open files or start|打开文件/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Create blank document|新建空白文档/ }));
    const target = screen.getByLabelText(/Batch output format|批量输出格式/);
    fireEvent.click(target);
    expect(screen.getAllByRole("option")).toHaveLength(6);
    fireEvent.click(screen.getByRole("option", { name: "Org mode" }));
    expect(target.textContent).toContain("Org mode");
  });

  it("keeps the file-home queue while visiting another workspace", async () => {
    render(<App />);
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "kept.png");
    fireEvent.change(screen.getByLabelText(/Choose files|选择文件/), { target: { files: [png] } });
    await waitFor(() => expect(screen.getAllByText(/kept\.png/).length).toBeGreaterThan(0));
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);
    fireEvent.click(tabs[0]);
    expect(screen.getAllByText(/kept\.png/).length).toBeGreaterThan(0);
  });
});
