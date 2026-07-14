import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@toolbox/i18n/react";
import { OutputDesk } from "../OutputDesk";
import { translations } from "../i18n";
import { registerTaskOutputs } from "../lib/output-registry";

afterEach(cleanup);

describe("output desk", () => {
  it("applies a global naming scope and previews an individual text result", async () => {
    const outputs = registerTaskOutputs([], [
      { blob: new Blob(["alpha"], { type: "text/plain" }), name: "notes.txt", family: "text", tool: "text" },
      { blob: new Blob(["a,b"], { type: "text/csv" }), name: "table.csv", family: "data", tool: "data" },
    ], 1).outputs;
    const batchRename = vi.fn();
    render(<I18nProvider translations={translations}><OutputDesk outputs={outputs} onRename={vi.fn()} onBatchRename={batchRename} onRemove={vi.fn()} onClear={vi.fn()}/></I18nProvider>);
    fireEvent.change(screen.getByLabelText(/Batch naming template|批量命名模板/), { target: { value: "result-{index}" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply names|应用命名/ }));
    expect(batchRename).toHaveBeenCalledWith(outputs.map((output) => output.id), "result-{index}");
    fireEvent.click(screen.getByRole("button", { name: /^notes\.txt/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());
  });
});
