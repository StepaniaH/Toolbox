import {
  handlePdfJobRequest,
  type PdfJobProgress, type PdfJobRequest, type PdfJobResponse,
} from "./pdf-engine";

type ActiveJob = { terminate: () => void };

const activeJobs = new Set<ActiveJob>();

export function cancelActivePdfJobs(): void {
  for (const job of activeJobs) job.terminate();
}

export function runPdfJob<T>(request: PdfJobRequest, options?: { onProgress?: PdfJobProgress }): Promise<T> {
  if (typeof Worker === "undefined") return runInline<T>(request, options?.onProgress);
  return runInWorker<T>(request, options?.onProgress);
}

async function runInline<T>(request: PdfJobRequest, onProgress?: PdfJobProgress): Promise<T> {
  return settlePdfResponse<T>(await handlePdfJobRequest(request, onProgress));
}

function runInWorker<T>(request: PdfJobRequest, onProgress?: PdfJobProgress): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./pdf-worker.ts", import.meta.url), { type: "module" });
    } catch {
      void runInline(request, onProgress).then(resolve, reject);
      return;
    }
    const job: ActiveJob = {
      terminate: () => {
        activeJobs.delete(job);
        worker.terminate();
        reject(new Error("pdf-cancelled"));
      },
    };
    activeJobs.add(job);
    worker.onmessage = (event: MessageEvent<PdfJobResponse>) => {
      const response = event.data;
      if (response.id !== request.id) return;
      if (response.type === "progress") {
        onProgress?.(response.done, response.total);
        return;
      }
      settleJob();
      if (response.type === "error") reject(new Error(response.key));
      else resolve(response.value as T);
    };
    worker.onerror = () => {
      settleJob();
      reject(new Error("pdf-worker-failed"));
    };
    worker.postMessage(request);

    function settleJob(): void {
      activeJobs.delete(job);
      worker.terminate();
    }
  });
}

async function settlePdfResponse<T>(response: PdfJobResponse): Promise<T> {
  if (response.type === "error") throw new Error(response.key);
  if (response.type === "result") return response.value as T;
  throw new Error("pdf-invalid");
}
