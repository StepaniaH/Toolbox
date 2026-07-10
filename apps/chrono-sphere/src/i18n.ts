import {
  createTranslator,
  type Lang,
  type TranslateParams,
  type Translations,
} from '@toolbox/i18n';
import zhJson from './translations/zh.json';
import enJson from './translations/en.json';

export type Locale = Lang;
export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const zhTranslations = zhJson as unknown as Translations;
export const enTranslations = enJson as unknown as Translations;

const translators: Record<Locale, (key: string, params?: TranslateParams) => string> = {
  zh: createTranslator(zhTranslations),
  en: createTranslator(enTranslations),
};

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  return translators[locale](key, vars);
}
