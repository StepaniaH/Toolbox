/* ==========================================================================
   i18n — Chinese / English translations
   Card copy is registered from the canonical app manifest at startup.
   ========================================================================== */

import {
  getLang as getCoreLang,
  onChange,
  setLang as setCoreLang,
} from "@toolbox/i18n/core";
import zhHant from "./zh-hant.generated.json";

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

/* Register per-tool card strings from the manifest presentation contract. */
export function registerCardStrings(tools) {
  for (const tool of tools) {
    const presentation = tool.presentation;
    if (!presentation) continue;
    for (const lang of ["zh", "en"]) {
      if (presentation.title) {
        i18n[lang][`card.${tool.id}.title`] = presentation.title[lang];
      }
      i18n[lang][`card.${tool.id}.subtitle`] = presentation.subtitle[lang];
      i18n[lang][`card.${tool.id}.desc`] = presentation.description[lang];
    }
  }
}

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (i18n[lang]?.[key]) {
      el.textContent = i18n[lang][key];
    }
  });
  // Update lang toggle button text
  const toggle = document.getElementById("langToggle");
  if (toggle) toggle.textContent = i18n[lang]["nav.lang"];
  // Update HTML lang attr
  document.documentElement.lang = lang === "en" ? "en" : lang === "zh-Hant" ? "zh-TW" : "zh-CN";
}

export function setLang(lang) {
  setCoreLang(lang);
  applyTranslations(lang);
}

export function toggleLang() {
  const current = document.documentElement.lang.startsWith("zh") ? "zh" : "en";
  setLang(current === "zh" ? "en" : "zh");
}

onChange(applyTranslations);
