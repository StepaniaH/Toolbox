import { PDFDocument } from "pdf-lib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelActivePdfJobs, runPdfJob } from "../lib/pdf-client";

type FakeMessage = { data: unknown };

class FakeWorker {
  static instances: FakeWorker[] = [];
  readonly url: string;
  readonly options: unknown;
  terminated = false;
  onmessage: ((event: FakeMessage) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  constructor(url: string | URL, options?: unknown) {
    this.url = String(url);
    this.options = options;
    FakeWorker.instances.push(this);
  }

  postMessage(): void {}

  terminate(): void {
    this.terminated = true;
  }

  emit(data: unknown): void {
    this.onmessage?.({ data });
  }
}

async function makePdfBlob(pageCount: number): Promise<Blob> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) document.addPage([300 + index, 400]);
  return new Blob([Uint8Array.from(await document.save()).buffer], { type: "application/pdf" });
}

function installFakeWorker(): typeof FakeWorker {
  vi.stubGlobal("Worker", FakeWorker);
  return FakeWorker;
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeWorker.instances = [];
});

describe("pdf job client", () => {
  it("runs merge jobs on a module worker and forwards progress", async () => {
    const Fake = installFakeWorker();
    const first = await makePdfBlob(1);
    const second = await makePdfBlob(1);
    const resultDoc = await PDFDocument.create();
    resultDoc.addPage([320, 240]);
    const resultBytes = Uint8Array.from(await resultDoc.save()).buffer;
    const progress: Array<[number, number]> = [];
    const pending = runPdfJob<ArrayBuffer>({ id: "job-1", type: "merge", files: [first, second] }, {
      onProgress: (done, total) => progress.push([done, total]),
    });

    const worker = Fake.instances.at(-1);
    expect(worker?.url.includes("pdf-worker")).toBe(true);
    expect(worker?.options).toMatchObject({ type: "module" });

    worker?.emit({ id: "job-1", type: "progress", done: 1, total: 2 });
    worker?.emit({ id: "job-1", type: "result", value: resultBytes });
    const output = await PDFDocument.load(await pending);
    expect(output.getPageCount()).toBe(1);
    expect(progress).toEqual([[1, 2]]);
  });

  it("rejects with the normalized error key from the worker", async () => {
    const Fake = installFakeWorker();
    const pending = runPdfJob<unknown>({ id: "job-2", type: "split", file: new Blob([new Uint8Array(16)]) });
    const worker = Fake.instances.at(-1);
    worker?.emit({ id: "job-2", type: "error", key: "pdf-invalid" });
    await expect(pending).rejects.toThrow("pdf-invalid");
  });

  it("cancels the active job by terminating its worker", async () => {
    const Fake = installFakeWorker();
    const source = await makePdfBlob(1);
    const pending = runPdfJob<unknown>({ id: "job-3", type: "rewrite", file: source, options: { pageIndices: [0] } });
    cancelActivePdfJobs();
    await expect(pending).rejects.toThrow("pdf-cancelled");
    expect(Fake.instances[0]?.terminated).toBe(true);
  });

  it("cancels remaining jobs while settled ones are already tracked off", async () => {
    const Fake = installFakeWorker();
    const source = await makePdfBlob(1);
    const firstJob = runPdfJob<unknown>({ id: "job-4a", type: "inspect", file: source });
    const secondJob = runPdfJob<unknown>({ id: "job-4b", type: "inspect", file: source });
    Fake.instances[0]?.emit({ id: "job-4a", type: "result", value: { pageCount: 1 } });
    await expect(firstJob).resolves.toMatchObject({ pageCount: 1 });

    cancelActivePdfJobs();
    await expect(secondJob).rejects.toThrow("pdf-cancelled");
    await expect(firstJob).resolves.toMatchObject({ pageCount: 1 });
  });

  it("falls back to inline execution when Worker is unavailable", async () => {
    vi.stubGlobal("Worker", undefined);
    const first = await makePdfBlob(1);
    const second = await makePdfBlob(1);
    const bytes = await runPdfJob<ArrayBuffer>({ id: "job-5", type: "merge", files: [first, second] });
    const output = await PDFDocument.load(bytes as ArrayBuffer);
    expect(output.getPageCount()).toBe(2);
  });
});
