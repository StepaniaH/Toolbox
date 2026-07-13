import { describe, expect, it } from "vitest";
import { inspectPdf } from "../lib/pdf-inspector";

describe("bounded PDF inspection", () => {
  it("reports non-authoritative structure hints without rewriting the document", async () => {
    const source = `%PDF-1.7\n1 0 obj\n<< /Linearized 1 >>\nendobj\n2 0 obj\n<< /Type /Page /MediaBox [0 0 612 792] >>\nendobj\ntrailer << /Encrypt 4 0 R /Info 5 0 R >>\n%%EOF`;
    expect(await inspectPdf(new Blob([source]))).toEqual({ version: "1.7", pageEstimate: 1, objectCount: 2, encrypted: true, linearized: true, metadata: true, mediaBox: [612, 792] });
  });

  it("rejects empty and non-PDF input", async () => {
    await expect(inspectPdf(new Blob([]))).rejects.toThrow("pdf-empty");
    await expect(inspectPdf(new Blob(["plain text"]))).rejects.toThrow("pdf-invalid");
  });
});
