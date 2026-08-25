// @toolbox/i18n — framework-agnostic internationalisation core.
//
// Single source of truth for the active language across Toolbox apps.
// The language is stored in localStorage under "toolbox-lang" (shared with
// @toolbox/nav) and broadcast to subscribers via onChange().
//
// createTranslator(translations) returns a t(key, params?) function bound to
// one language's translation map. The React wrapper (@toolbox/i18n/react)
// picks the right map from getLang() and re-creates the translator whenever
// setLang() fires.
//
// Everything here is SSR-safe: every window/localStorage/navigator access is
// guarded by `typeof window !== "undefined"`.

const STORAGE_KEY = "toolbox-lang";

export type Lang = "zh" | "zh-Hant" | "en";

/** Nested translation map: leaves are strings, branches are nested maps. */
export type Translations = { [key: string]: string | Translations };

export type TranslateParams = Record<string, string | number>;

export type TranslateFn = (key: string, params?: TranslateParams) => string;

const listeners = new Set<(lang: Lang) => void>();

const DOCUMENT_LANGS: Record<Lang, string> = {
  zh: "zh-CN",
  "zh-Hant": "zh-TW",
  en: "en",
};

function applyDocumentLang(lang: Lang): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = DOCUMENT_LANGS[lang];
  }
}

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "zh";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "zh" || stored === "zh-Hant" || stored === "en") return stored;
  } catch {
    /* localStorage unavailable (private mode / SSR) — fall through */
  }
  const navLang =
    typeof navigator !== "undefined" && typeof navigator.language === "string"
      ? navigator.language
      : "";
  return navLang.toLowerCase().startsWith("zh") ? "zh" : "en";
}

let currentLang: Lang = detectInitialLang();
applyDocumentLang(currentLang);

/** Current active language ("zh" | "zh-Hant" | "en"). */
export function getLang(): Lang {
  return currentLang;
}

/** Persist + switch the active language, then notify every onChange listener. */
export function setLang(lang: Lang): Lang {
  if (lang !== "zh" && lang !== "zh-Hant" && lang !== "en") {
    throw new Error(`setLang: expected "zh", "zh-Hant" or "en", got ${String(lang)}`);
  }
  applyDocumentLang(lang);
  if (lang === currentLang) return lang;
  currentLang = lang;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore persistence failures */
    }
  }
  listeners.forEach((cb) => {
    try {
      cb(lang);
    } catch {
      /* a listener throwing must not break the others */
    }
  });
  return lang;
}

/**
 * Subscribe to language changes. Returns an unsubscribe function.
 * Call it inside useEffect cleanup: `useEffect(() => onChange(setLang), [])`.
 */
export function onChange(cb: (lang: Lang) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

/**
 * Create a translator bound to one language's translation map.
 * Supports dotted nested keys (`t("nav.about")`) and `{{name}}` interpolation.
 * A missing key consults the optional fallback translator before returning the
 * key itself, so partial locales degrade to a readable language instead of
 * leaking raw keys into the UI.
 */
export function createTranslator(
  translations: Translations,
  fallback?: TranslateFn,
): TranslateFn {
  return (key, params) => {
    const value = getNested(translations, key);
    if (typeof value === "string") return interpolate(value, params);
    if (fallback) return fallback(key, params);
    return key;
  };
}

/**
 * BCP-47 locale for `Intl` APIs under the active UI language.
 * Always use this instead of `lang === "zh" ? "zh-CN" : "en"` binary checks,
 * which silently give Traditional Chinese users the wrong locale.
 */
export function intlLocale(lang: Lang): string {
  return lang === "zh" ? "zh-CN" : lang === "zh-Hant" ? "zh-TW" : "en";
}

function translationKeys(
  translations: Translations,
  prefix = "",
  out: string[] = [],
): string[] {
  for (const key of Object.keys(translations)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = translations[key];
    if (typeof value === "string") out.push(path);
    else translationKeys(value, path, out);
  }
  return out;
}

/**
 * Assert that every UI language carries the exact same set of translation
 * keys. Call from an app's unit test with its full locale record; a drift
 * fails the test naming the first missing key instead of leaking raw keys
 * into a shipped locale.
 */
export function assertTranslationParity(
  translations: Partial<Record<Lang, Translations>>,
): void {
  const langs = Object.keys(translations) as Lang[];
  if (langs.length < 2) return;
  const baselineLang = langs[0];
  const baselineMap = baselineLang ? translations[baselineLang] : undefined;
  if (!baselineLang || !baselineMap) return;
  const baseline = translationKeys(baselineMap).sort();
  for (const lang of langs.slice(1)) {
    const map = translations[lang];
    if (!map) continue;
    const keys = translationKeys(map).sort();
    const missing = baseline.find((key) => !keys.includes(key));
    if (missing) {
      throw new Error(
        `translation parity: "${lang}" is missing key "${missing}" (baseline ${baselineLang})`,
      );
    }
    const extra = keys.find((key) => !baseline.includes(key));
    if (extra) {
      throw new Error(
        `translation parity: "${lang}" has unknown key "${extra}" (baseline ${baselineLang})`,
      );
    }
  }
}
