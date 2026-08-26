import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const appRoot = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, appRoot), 'utf8')

function loadI18n() {
  const document = {
    documentElement: {},
    querySelectorAll: () => [],
    title: '',
  }
  const localStorage = { getItem: () => null }
  const window = { __MONITOR_CHOICE_MANUAL_BOOT__: true, document, localStorage }
  const context = vm.createContext({ window, document, localStorage })
  for (const script of ['js/i18n.js', 'js/i18n-zh.js', 'js/i18n-zh-hant.js', 'js/i18n-en.js']) {
    vm.runInContext(read(script), context, { filename: script })
  }
  return window.I18n
}

test('generated zh-Hant catalog keeps exact key parity with zh', () => {
  const i18n = loadI18n()
  const zhKeys = Object.keys(i18n.translations.zh).sort()
  const zhHantKeys = Object.keys(i18n.translations.zhHant).sort()
  assert.ok(zhKeys.length > 0, 'zh catalog must not be empty')
  assert.deepEqual(zhHantKeys, zhKeys, 'zh-Hant drifts from zh')

  for (const [lang, map] of Object.entries(i18n.translations)) {
    for (const [key, value] of Object.entries(map)) {
      assert.equal(typeof value, 'string', `${lang}:${key} must be a string`)
      assert.ok(value.length > 0, `${lang}:${key} is empty`)
    }
  }
})

test('en catalog only defines keys that exist in zh', () => {
  const i18n = loadI18n()
  const zhKeys = new Set(Object.keys(i18n.translations.zh))
  for (const key of Object.keys(i18n.translations.en)) {
    assert.ok(zhKeys.has(key), `en defines unknown key ${key}`)
  }
})

test('setLocale accepts shared language codes and resolves zh-Hant content', () => {
  const i18n = loadI18n()
  i18n.setLocale('zh-Hant')
  assert.equal(i18n.getLocale(), 'zh-Hant')

  const zhHant = i18n.translations.zhHant
  const zh = i18n.translations.zh
  const differingKey = Object.keys(zh).find((key) => zh[key] !== zhHant[key])
  if (differingKey) {
    assert.equal(i18n.t(differingKey), zhHant[differingKey])
  }

  i18n.setLocale('zhHant')
  assert.equal(i18n.getLocale(), 'zh-Hant', 'legacy zhHant alias must normalize')

  i18n.setLocale('en')
  assert.equal(i18n.getLocale(), 'en')
})
