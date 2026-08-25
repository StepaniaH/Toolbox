import { describe, it } from 'vitest'
import { assertTranslationParity } from '@toolbox/i18n/core'
import zh from '../translations/zh.json'
import zhHant from '../translations/zh-Hant.json'
import en from '../translations/en.json'
import type { Translations } from '@toolbox/i18n/core'

describe('rate-lens translation catalogs', () => {
  it('keeps zh, zh-Hant and en key sets identical', () => {
    assertTranslationParity({
      zh: zh as Translations,
      'zh-Hant': zhHant as Translations,
      en: en as Translations,
    })
  })
})
