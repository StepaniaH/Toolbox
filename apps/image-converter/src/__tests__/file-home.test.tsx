import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@toolbox/i18n/react";
import { collectDroppedFiles, FileHome } from "../FileHome";
import { translations } from "../i18n";

afterEach(cleanup);

describe("file home", () => {
  it("identifies a file before offering an explicit tool action", async () => {
    const openImage = vi.fn();
    render(<I18nProvider translations={translations}><FileHome onOpenImage={openImage} onOpenGif={vi.fn()} onOpenText={vi.fn()} onOpenData={vi.fn()} onOpenPdf={vi.fn()} onOpenArchive={vi.fn()}/></I18nProvider>);
    const input = screen.getByLabelText(/Add files|添加文件/);
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "photo.dat");
    fireEvent.change(input, { target: { files: [png] } });
    await waitFor(() => expect(screen.getByText(/PNG · 8 B/)).toBeTruthy());
    expect(screen.getByText(/^(Content signature|文件内容签名)$/i)).toBeTruthy();
    expect(openImage).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /Open tool|打开工具/ })[0]);
    expect(openImage).toHaveBeenCalledWith([png], "default");
  });

  it("walks dropped folders through the unified intake and keeps relative paths", async () => {
    const file = new File(["local"], "notes.txt", { type: "text/plain" });
    let read = false;
    const fileEntry = { name: "notes.txt", isFile: true, isDirectory: false, file: (success: (value: File) => void) => success(file) };
    const folderEntry = {
      name: "project", isFile: false, isDirectory: true,
      createReader: () => ({ readEntries: (success: (entries: typeof fileEntry[]) => void) => { success(read ? [] : [fileEntry]); read = true; } }),
    };
    const transfer = { items: [{ webkitGetAsEntry: () => folderEntry }], files: [] } as unknown as DataTransfer;
    expect(await collectDroppedFiles(transfer)).toEqual([{ file, relativePath: "project/notes.txt" }]);
  });

  it("routes a checked file family as one batch and opens an item preview separately", async () => {
    const openImage = vi.fn();
    render(<I18nProvider translations={translations}><FileHome onOpenImage={openImage} onOpenGif={vi.fn()} onOpenText={vi.fn()} onOpenData={vi.fn()} onOpenPdf={vi.fn()} onOpenArchive={vi.fn()}/></I18nProvider>);
    const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const files = [new File([signature], "one.png"), new File([signature], "two.png")];
    fireEvent.change(screen.getByLabelText(/Add files|添加文件/), { target: { files } });
    await waitFor(() => expect(screen.getAllByText(/PNG · 8 B/)).toHaveLength(2));
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Open tool|打开工具/ })[0]);
    expect(openImage).toHaveBeenCalledWith(files, "default");
    fireEvent.click(screen.getByRole("button", { name: /Item preview|单项预览/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
