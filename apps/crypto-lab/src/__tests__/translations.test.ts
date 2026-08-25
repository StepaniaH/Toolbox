import { describe, expect, it } from 'vitest'
import { assertTranslationParity } from '@toolbox/i18n/core'
import zh from '../translations/zh.json'
import zhHant from '../translations/zh-Hant.json'
import en from '../translations/en.json'
import type { Translations } from '@toolbox/i18n/core'

describe('crypto-lab translation catalogs', () => {
  it('keeps zh, zh-Hant and en key sets identical', () => {
    assertTranslationParity({
      zh: zh as Translations,
      'zh-Hant': zhHant as Translations,
      en: en as Translations,
    })
  })

  it('covers the knowledge-base content subtree in every locale', () => {
    for (const catalog of [zh, zhHant, en] as Array<Record<string, unknown>>) {
      const kb = catalog.kbContent as Record<string, unknown>
      expect(Object.keys(kb)).toEqual(
        expect.arrayContaining(['encoding', 'hash', 'hmac', 'symmetric', 'rsa', 'jwt', 'base', 'columns']),
      )
    }
  })
})
