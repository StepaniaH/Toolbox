/* ==========================================================================
   i18n — Chinese / English translations
   Card copy is registered from the canonical app manifest at startup.
   ========================================================================== */

import {
  getLang as getCoreLang,
  onChange,
  setLang as setCoreLang,
} from "@toolbox/i18n/core";
import zhHant from "./zh-hant.generated.json" with { type: "json" };

const i18n = {
  "zh-Hant": zhHant,

  zh: {
    "site.title": "工具箱",
    "site.tagline": "隐私优先的网页工具集。",

    "card.cta": "打开工具",

    "footer.privacy": "零追踪 · 零 Cookie · 系统字体",
    "footer.source": "源码",
  },

  en: {
    "site.title": "Toolbox",
    "site.tagline": "Privacy-first web tools.",

    "card.cta": "Open Tool",

    "footer.privacy": "No tracking · No cookies · System fonts",
    "footer.source": "Source",
  },
};

export function getLang() {
  return getCoreLang();
}

/* Register per-tool card strings from the manifest presentation contract.
   Manifest fields use the camelCase `zhHant`; UI language codes use `zh-Hant`. */
export function registerCardStrings(tools) {
  for (const tool of tools) {
    const presentation = tool.presentation;
    if (!presentation) continue;
    for (const lang of ["zh", "zh-Hant", "en"]) {
      const field = lang === "zh-Hant" ? "zhHant" : lang;
      if (presentation.title) {
        i18n[lang][`card.${tool.id}.title`] = presentation.title[field];
      }
      i18n[lang][`card.${tool.id}.subtitle`] = presentation.subtitle[field];
      i18n[lang][`card.${tool.id}.desc`] = presentation.description[field];
    }
  }
}

/* Exposed for tests; UI code goes through applyTranslations/setLang. */
export const translations = i18n;

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (i18n[lang]?.[key]) {
      el.textContent = i18n[lang][key];
    }
  });
}

export function setLang(lang) {
  setCoreLang(lang);
  applyTranslations(lang);
}

onChange(applyTranslations);
