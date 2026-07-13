import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../App";
import { translations } from "../i18n";
import { createZip } from "../lib/zip";

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

  it("exposes automatic routing plus manual family workspaces", () => {
    render(<App />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(7);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    fireEvent.click(tabs[6]);
    expect(tabs[6].getAttribute("aria-selected")).toBe("true");
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

  it("opens PDF and ZIP families manually and reports local structure", async () => {
    render(<App />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[4]);
    const pdf = new File(["%PDF-1.7\n1 0 obj\n<< /Type /Page /MediaBox [0 0 612 792] >>\nendobj\n%%EOF"], "notes.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Open PDF|打开 PDF/), { target: { files: [pdf] } });
    await waitFor(() => expect(screen.getByText("PDF 1.7")).toBeTruthy());

    fireEvent.click(tabs[5]);
    const zipBlob = await createZip([{ name: "safe/notes.txt", blob: new Blob(["local"]) }]);
    const zip = new File([await readBlob(zipBlob)], "notes.zip", { type: "application/zip" });
    fireEvent.change(screen.getByLabelText(/Open ZIP|打开 ZIP/), { target: { files: [zip] } });
    await waitFor(() => expect(screen.getByText("safe/notes.txt")).toBeTruthy());
  });
});

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
