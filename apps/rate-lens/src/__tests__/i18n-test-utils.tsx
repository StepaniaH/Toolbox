import { createElement, type ReactNode } from 'react'
import { I18nProvider } from '@toolbox/i18n/react'
import { setLang } from '@toolbox/i18n'
import zh from '../translations/zh.json'
import en from '../translations/en.json'

// Component tests assert on Chinese UI text, so pin the language to zh.
setLang('zh')

export function I18nWrapper({ children }: { children: ReactNode }) {
  return createElement(
    I18nProvider,
    { translations: { zh, en } },
    children,
  )
}
