import { describe, expect, it } from "vitest";
import { createZip } from "../lib/zip";
import { collectBoundedStream, extractZipEntry, readZipDirectory } from "../lib/zip-reader";

describe("safe ZIP inspection and extraction", () => {
  it("lists and verifies UTF-8 store entries produced locally", async () => {
    const archive = await createZip([{ name: "folder/说明.txt", blob: new Blob(["private locally"]) }]);
    const directory = await readZipDirectory(archive);
    expect(directory.entries).toHaveLength(1);
    expect(directory.entries[0]).toMatchObject({ name: "folder/说明.txt", method: 0, safe: true });
    const extracted = await extractZipEntry(archive, directory.entries[0]);
    expect(new TextDecoder().decode(await readBlob(extracted))).toBe("private locally");
  });

  it("blocks traversal paths even when the archive structure is otherwise valid", async () => {
    const archive = await createZip([{ name: "../outside.txt", blob: new Blob(["blocked"]) }]);
    const directory = await readZipDirectory(archive);
    expect(directory.entries[0]).toMatchObject({ safe: false, reason: "path" });
    await expect(extractZipEntry(archive, directory.entries[0])).rejects.toThrow("zip-entry-blocked");
  });

  it("blocks duplicate archive paths case-insensitively", async () => {
    const archive = await createZip([
      { name: "folder/notes.txt", blob: new Blob(["first"]) },
      { name: "FOLDER/NOTES.txt", blob: new Blob(["second"]) },
    ]);
    const directory = await readZipDirectory(archive);
    expect(directory.entries[0].safe).toBe(true);
    expect(directory.entries[1]).toMatchObject({ safe: false, reason: "duplicate" });
  });

  it("stops a decompression stream as soon as declared output size is exceeded", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.enqueue(new Uint8Array([4, 5, 6]));
        controller.close();
      },
    });
    await expect(collectBoundedStream(stream, 4)).rejects.toThrow("zip-integrity");
  });

  it("rejects non-ZIP input", async () => {
    await expect(readZipDirectory(new Blob(["not a zip"]))).rejects.toThrow("zip-invalid");
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
