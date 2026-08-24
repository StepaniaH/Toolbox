import assert from 'node:assert/strict'
import test from 'node:test'
import { getAppById } from '@toolbox/app-manifest'

const app = getAppById('settings')

test('manifest registers the hidden tool with bilingual search keywords', () => {
  assert.ok(app)
  assert.equal(app.status, 'hidden')
  assert.equal(app.path, '/settings/')
  assert.ok(app.keywords.zh.length > 0)
  assert.ok(app.keywords.en.length > 0)
})

test('private storage keys stay inside the toolbox.settings namespace', () => {
  // Enforced again by pnpm check:contracts across the workspace.
  assert.match(`toolbox.settings.example`, /^toolbox\.settings\./)
})

test('settings translations keep zh, zh-Hant and en key sets identical', async () => {
  const { translations } = await import('../src/translations.ts')
  const flatten = (node, prefix = '') =>
    Object.entries(node).flatMap(([key, value]) =>
      typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    )
  const zh = flatten(translations.zh).sort()
  const zhHant = flatten(translations['zh-Hant']).sort()
  const en = flatten(translations.en).sort()
  assert.deepEqual(zhHant, zh)
  assert.deepEqual(en, zh)
  assert.ok(zh.length >= 15)
})
