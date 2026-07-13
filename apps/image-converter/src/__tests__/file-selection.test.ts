import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES } from "../lib/convert";
import { selectIncomingFiles } from "../lib/file-selection";

function image(name: string, size = 4, lastModified = 1): File {
  return new File([new Uint8Array(size)], name, { type: "image/png", lastModified });
}

describe("file selection diagnostics", () => {
  it("returns every skipped file with a specific reason", () => {
    const existing = [{ file: image("same.png"), relativePath: "same.png" }];
    const duplicate = image("same.png");
    const empty = image("empty.png", 0);
    const unsupported = new File(["text"], "notes.txt", { type: "text/plain" });
    const oversized = image("huge.png");
    Object.defineProperty(oversized, "size", { value: MAX_FILE_BYTES + 1 });
    const result = selectIncomingFiles(existing, [duplicate, empty, unsupported, oversized, image("okay.png")]);

    expect(result.accepted.map((entry) => entry.relativePath)).toEqual(["okay.png"]);
    expect(result.rejected.map((entry) => [entry.relativePath, entry.reason])).toEqual([
      ["same.png", "duplicate"],
      ["empty.png", "empty"],
      ["notes.txt", "unsupported"],
      ["huge.png", "too-large"],
    ]);
  });

  it("keeps folder-relative paths in diagnostics", () => {
    const file = image("readme.txt");
    Object.defineProperty(file, "webkitRelativePath", { value: "album/readme.txt" });
    const result = selectIncomingFiles([], [file]);
    expect(result.rejected[0]).toMatchObject({ relativePath: "album/readme.txt", reason: "unsupported" });
  });
});
