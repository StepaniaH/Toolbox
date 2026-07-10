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

export type Lang = "zh" | "en";

/** Nested translation map: leaves are strings, branches are nested maps. */
export type Translations = { [key: string]: string | Translations };

export type TranslateParams = Record<string, string | number>;

export type TranslateFn = (key: string, params?: TranslateParams) => string;

const listeners = new Set<(lang: Lang) => void>();

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "zh";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "zh" || stored === "en") return stored;
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

/** Current active language ("zh" | "en"). */
export function getLang(): Lang {
  return currentLang;
}

/** Persist + switch the active language, then notify every onChange listener. */
export function setLang(lang: Lang): Lang {
  if (lang !== "zh" && lang !== "en") {
    throw new Error(`setLang: expected "zh" or "en", got ${String(lang)}`);
  }
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
 * Missing keys fall back to the key itself so the UI never breaks.
 */
export function createTranslator(translations: Translations): TranslateFn {
  return (key, params) => {
    const value = getNested(translations, key);
    if (typeof value === "string") return interpolate(value, params);
    return key;
  };
}
