// @toolbox/i18n — language registry.
//
// Single source of truth for the interface languages Toolbox supports. The
// Settings language picker renders this list Apple-style: the native name as
// the primary line and the current UI language's name for the language as
// the secondary line, generated at runtime with Intl.DisplayNames.
//
// A language only becomes selectable once `covered` is true, meaning every
// app ships complete translations for it. toolbox-lang accepts exactly the
// covered codes; unknown or uncovered stored values fall back to the
// previous valid value, then to the default.

export const LANG_REGISTRY_VERSION = 1

export type LanguageRegistryEntry = {
  code: string
  nativeName: string
  /** zh-CN rendering of the code, used when the UI language is zh. */
  zhName: string
  covered: boolean
}

export const LANGUAGE_REGISTRY: readonly LanguageRegistryEntry[] = Object.freeze([
  { code: 'en', nativeName: 'English', zhName: '英语', covered: true },
  { code: 'zh', nativeName: '简体中文', zhName: '简体中文', covered: true },
  { code: 'zh-Hant', nativeName: '繁體中文', zhName: '繁體中文', covered: false },
])

export const COVERED_LANGUAGES: readonly LanguageRegistryEntry[] = Object.freeze(
  LANGUAGE_REGISTRY.filter((entry) => entry.covered),
)

export function isCoveredLanguage(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    COVERED_LANGUAGES.some((entry) => entry.code === value)
  )
}

/**
 * Secondary line for the picker: the language's name rendered in the current
 * UI language. Falls back to the code when Intl.DisplayNames is unavailable.
 */
export function languageDisplayName(code: string, uiLang: string): string {
  if (uiLang === 'zh') {
    return LANGUAGE_REGISTRY.find((entry) => entry.code === code)?.zhName ?? code
  }
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}
