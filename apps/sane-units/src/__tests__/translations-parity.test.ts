// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { assertTranslationParity } from '@toolbox/i18n/core'
import { TRANSLATIONS } from '../lib/i18n'

function countLeaves(node: unknown): number {
  if (node && typeof node === 'object') {
    return Object.values(node).reduce<number>((sum, value) => sum + countLeaves(value), 0)
  }
  return 1
}

describe('SaneUnits 词表三语齐平', () => {
  it('zh / zh-Hant / en 键位完全一致', () => {
    // Baseline first: the assertion names the first drifting key on failure.
    expect(countLeaves(TRANSLATIONS['zh-CN'])).toBeGreaterThan(200)
    assertTranslationParity({
      zh: TRANSLATIONS['zh-CN'],
      'zh-Hant': TRANSLATIONS['zh-Hant'],
      en: TRANSLATIONS.en,
    })
  })
})
