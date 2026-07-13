import { describe, expect, it } from "vitest";
import { buildOutputName, makeUniquePath, sanitizeFilename, splitFilename, validateRename } from "../lib/rename";
import type { RenameSettings } from "../lib/types";

const template: RenameSettings = {
  mode: "template", template: "{index}-{name}-{format}-{width}x{height}", pattern: "", replacement: "",
  global: false, ignoreCase: false, start: 7, padding: 3,
};

describe("filename generation", () => {
  it("splits dotted and dotless filenames", () => {
    expect(splitFilename("holiday.final.JPG")).toEqual({ stem: "holiday.final", extension: "jpg" });
    expect(splitFilename("README")).toEqual({ stem: "README", extension: "" });
  });

  it("expands padded tokens and JPEG extension", () => {
    expect(buildOutputName({ filename: "cat.png", index: 2, format: "jpeg", width: 640, height: 480 }, template))
      .toBe("008-cat-jpg-640x480.jpg");
  });

  it("supports regex capture groups and tokens", () => {
    const regex: RenameSettings = { ...template, mode: "regex", pattern: "^IMG_(.*)$", replacement: "photo-$1-{index}", start: 1, padding: 2 };
    expect(buildOutputName({ filename: "IMG_Summer.PNG", index: 3, format: "webp" }, regex)).toBe("photo-Summer-03.webp");
  });

  it("reports invalid expressions without throwing", () => {
    expect(validateRename({ ...template, mode: "regex", pattern: "[", replacement: "x" })).toBe("invalid-regex");
    expect(validateRename({ ...template, template: "" })).toBe("empty-template");
  });

  it("sanitizes portable filenames and resolves case-insensitive conflicts", () => {
    expect(sanitizeFilename("CON")).toBe("_CON");
    expect(sanitizeFilename("a/b:*? ")).toBe("a_b___");
    const used = new Set<string>();
    expect(makeUniquePath("trip/photo.webp", used)).toBe("trip/photo.webp");
    expect(makeUniquePath("trip/PHOTO.webp", used)).toBe("trip/PHOTO-2.webp");
  });
});
