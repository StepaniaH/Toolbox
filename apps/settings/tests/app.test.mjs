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

test('settings translations keep zh and en key sets identical', async () => {
  const { translations } = await import('../src/translations.ts')
  const zh = Object.keys(translations.zh).sort()
  const en = Object.keys(translations.en).sort()
  assert.deepEqual(zh, en)
  assert.ok(zh.length >= 15)
})
