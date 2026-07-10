// @toolbox/i18n/react — React wrapper around the framework-agnostic core.
//
// <I18nProvider translations={...}> merges the shared translation maps
// (translations/zh.json, translations/en.json) with the host app's own
// translations and exposes { lang, setLang, t } via useTranslation().
// The provider subscribes to the core's onChange() so every component
// re-renders automatically when setLang() flips the global language.
//
// Uses createElement (no JSX) so this file can ship as .ts and stay
// consumable from both .ts and .tsx host files. Consumers still write
// <I18nProvider>…</I18nProvider> in their own .tsx.

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createTranslator,
  getLang,
  onChange,
  setLang as setCoreLang,
  type Lang,
  type Translations,
  type TranslateFn,
} from "./core";
import sharedZhJson from "./translations/zh.json";
import sharedEnJson from "./translations/en.json";

const sharedZh = sharedZhJson as unknown as Translations;
const sharedEn = sharedEnJson as unknown as Translations;

export type I18nProviderProps = {
  /** App-specific translations, overlaid on top of the shared maps. */
  translations?: Partial<Record<Lang, Translations>>;
  children: ReactNode;
};

export type TranslationContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslateFn;
};

const TranslationContext = createContext<TranslationContextValue>({
  lang: "zh",
  setLang: () => {},
  t: (key) => key,
});

function isTranslations(value: unknown): value is Translations {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base: Translations, override: Translations): Translations {
  const out: Translations = { ...base };
  for (const key of Object.keys(override)) {
    const b = base[key];
    const o = override[key];
    out[key] =
      isTranslations(o) && isTranslations(b) ? deepMerge(b, o) : o;
  }
  return out;
}

export function I18nProvider({ translations, children }: I18nProviderProps) {
  const [lang, setLangState] = useState<Lang>(() => getLang());

  // Re-render when the global language changes (from this or another tab).
  useEffect(() => onChange(setLangState), []);

  const t = useMemo<TranslateFn>(() => {
    const shared = lang === "en" ? sharedEn : sharedZh;
    const extra = translations?.[lang];
    return createTranslator(
      isTranslations(extra) ? deepMerge(shared, extra) : shared,
    );
  }, [lang, translations]);

  const value = useMemo<TranslationContextValue>(
    () => ({ lang, setLang: setCoreLang, t }),
    [lang, t],
  );

  return createElement(TranslationContext.Provider, { value }, children);
}

export function useTranslation(): TranslationContextValue {
  return useContext(TranslationContext);
}
