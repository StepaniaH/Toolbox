import { MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, isAcceptedImage } from "./convert";
import type { QueueItem, RejectedFile } from "./types";

export type FileSelection = {
  accepted: Array<{ file: File; relativePath: string }>;
  rejected: RejectedFile[];
};

function fileKey(relativePath: string, file: File): string {
  return `${relativePath}:${file.size}:${file.lastModified}`;
}

export function selectIncomingFiles(
  current: ReadonlyArray<Pick<QueueItem, "file" | "relativePath">>,
  incoming: readonly File[],
): FileSelection {
  const accepted: FileSelection["accepted"] = [];
  const rejected: RejectedFile[] = [];
  const keys = new Set(current.map((item) => fileKey(item.relativePath, item.file)));
  let totalBytes = current.reduce((sum, item) => sum + item.file.size, 0);

  for (const file of incoming) {
    const relativePath = file.webkitRelativePath || file.name;
    const rejection = (reason: RejectedFile["reason"]) => rejected.push({
      name: file.name,
      relativePath,
      size: file.size,
      reason,
    });
    const key = fileKey(relativePath, file);
    if (keys.has(key)) { rejection("duplicate"); continue; }
    if (!isAcceptedImage(file)) { rejection("unsupported"); continue; }
    if (file.size === 0) { rejection("empty"); continue; }
    if (file.size > MAX_FILE_BYTES) { rejection("too-large"); continue; }
    if (current.length + accepted.length >= MAX_FILES) { rejection("max-files"); continue; }
    if (totalBytes + file.size > MAX_TOTAL_BYTES) { rejection("total-size"); continue; }

    totalBytes += file.size;
    keys.add(key);
    accepted.push({ file, relativePath });
  }

  return { accepted, rejected };
}
