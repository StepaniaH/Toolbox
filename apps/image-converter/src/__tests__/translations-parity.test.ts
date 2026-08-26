import { describe, it, expect } from "vitest";
import { assertTranslationParity } from "@toolbox/i18n/core";
import { translations } from "../i18n";

describe("FormTran 词表三语齐平", () => {
  it("zh / zh-Hant / en 键位完全一致", () => {
    assertTranslationParity({
      zh: translations.zh,
      "zh-Hant": translations["zh-Hant"],
      en: translations.en,
    });
    expect(Object.keys(translations.zh).length).toBeGreaterThan(5);
  });
});
