import {
  handlePdfJobRequest, jobTransferables,
  type PdfJobRequest, type PdfJobResponse,
} from "./pdf-engine";

const context = self as unknown as {
  onmessage: ((event: MessageEvent<PdfJobRequest>) => void) | null;
  postMessage: (message: PdfJobResponse, transfer?: Transferable[]) => void;
};

context.onmessage = (event) => {
  const request = event.data;
  void handlePdfJobRequest(request, (done, total) => {
    context.postMessage({ id: request.id, type: "progress", done, total });
  }).then((response) => {
    context.postMessage(response, jobTransferables(response));
  });
};
