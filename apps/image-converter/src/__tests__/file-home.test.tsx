import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@toolbox/i18n/react";
import { FileHome } from "../FileHome";
import { translations } from "../i18n";

afterEach(cleanup);

describe("file home", () => {
  it("identifies a file before offering an explicit tool action", async () => {
    const openImage = vi.fn();
    render(<I18nProvider translations={translations}><FileHome onOpenImage={openImage} onOpenGif={vi.fn()} onOpenText={vi.fn()}/></I18nProvider>);
    const input = screen.getByLabelText(/Choose files|选择文件/);
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "photo.dat");
    fireEvent.change(input, { target: { files: [png] } });
    await waitFor(() => expect(screen.getByText(/PNG · 8 B/)).toBeTruthy());
    expect(screen.getByText(/^(Content signature|文件内容签名)$/i)).toBeTruthy();
    expect(openImage).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /Open tool|打开工具/ })[0]);
    expect(openImage).toHaveBeenCalledWith([png], "default");
  });
});
