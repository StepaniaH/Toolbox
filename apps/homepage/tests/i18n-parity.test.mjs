import assert from 'node:assert/strict'
import test from 'node:test'
import { getStableApps } from '@toolbox/app-manifest'
import { registerCardStrings, translations } from '../js/i18n.js'

const LANGS = ['zh', 'zh-Hant', 'en']

function registeredTools() {
  return getStableApps()
    .filter((app) => app.path !== '/' && app.presentation?.card !== false)
    .map((app) => ({ id: app.id, presentation: app.presentation }))
}

test('homepage catalogs stay key-aligned across zh, zh-Hant, and en', () => {
  registerCardStrings(registeredTools())

  const keySets = LANGS.map((lang) => Object.keys(translations[lang]).sort())
  for (const lang of LANGS.slice(1)) {
    assert.deepEqual(
      keySets[LANGS.indexOf(lang)],
      keySets[0],
      `${lang} catalog drifts from zh`,
    )
  }

  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(translations[lang])) {
      assert.equal(typeof value, 'string', `${key} must map to a string`)
      assert.ok(value.length > 0, `${key} has an empty ${lang} value`)
      assert.doesNotMatch(value, /^[a-z][a-z0-9]*(\.[a-z0-9]+)+$/, `${key} renders a raw key in ${lang}`)
    }
  }
})

test('manifest presentation copy exists in all three languages', () => {
  for (const app of getStableApps()) {
    if (app.path === '/' || app.presentation?.card === false) continue
    const field = (lang) => (lang === 'zh-Hant' ? 'zhHant' : lang)
    for (const lang of LANGS) {
      assert.ok(app.presentation.subtitle[field(lang)], `${app.id} subtitle missing ${lang}`)
      assert.ok(app.presentation.description[field(lang)], `${app.id} description missing ${lang}`)
    }
  }
})
