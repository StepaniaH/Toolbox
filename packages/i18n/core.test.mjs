import assert from 'node:assert/strict'
import test from 'node:test'
import { assertTranslationParity, createTranslator, intlLocale } from './core.ts'

test('missing keys fall back to the key itself', () => {
  const t = createTranslator({ nav: { home: '首页' } })
  assert.equal(t('nav.home'), '首页')
  assert.equal(t('nav.missing'), 'nav.missing')
})

test('a fallback translator resolves keys the primary map misses', () => {
  const zh = createTranslator({ nav: { home: '首页', about: '关于' } })
  const t = createTranslator({ nav: { home: '首頁' } }, zh)
  assert.equal(t('nav.home'), '首頁')
  assert.equal(t('nav.about'), '关于')
  assert.equal(t('nav.missing'), 'nav.missing')
})

test('fallback receives interpolation params', () => {
  const primary = createTranslator({})
  const fallback = createTranslator({ rows: '{{count}} 行' })
  const t = createTranslator(primary, fallback)
  assert.equal(t('rows', { count: 3 }), '3 行')
})

test('intlLocale maps every UI language to a BCP-47 locale', () => {
  assert.equal(intlLocale('zh'), 'zh-CN')
  assert.equal(intlLocale('zh-Hant'), 'zh-TW')
  assert.equal(intlLocale('en'), 'en')
})

test('translation parity passes for identical key sets and names the first drift', () => {
  assertTranslationParity({
    zh: { nav: { home: '首页', about: '关于' } },
    'zh-Hant': { nav: { home: '首頁', about: '關於' } },
    en: { nav: { home: 'Home', about: 'About' } },
  })
  assert.throws(
    () =>
      assertTranslationParity({
        zh: { nav: { home: '首页', about: '关于' } },
        en: { nav: { home: 'Home' } },
      }),
    /"en" is missing key "nav.about"/,
  )
  assert.throws(
    () =>
      assertTranslationParity({
        zh: { nav: { home: '首页' } },
        en: { nav: { home: 'Home', extra: 'Extra' } },
      }),
    /"en" has unknown key "nav.extra"/,
  )
})
