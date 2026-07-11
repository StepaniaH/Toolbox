import assert from 'node:assert/strict'
import test from 'node:test'
import {
  APP_STATUSES,
  TOOLBOX_APPS,
  defineApp,
  getAppById,
  getStableApps,
} from './manifest.js'

test('manifest ids and paths are unique', () => {
  assert.equal(new Set(TOOLBOX_APPS.map((app) => app.id)).size, TOOLBOX_APPS.length)
  assert.equal(new Set(TOOLBOX_APPS.map((app) => app.path)).size, TOOLBOX_APPS.length)
})

test('manifest routes are root or trailing-slash app paths', () => {
  for (const app of TOOLBOX_APPS) {
    assert.match(app.path, /^\/$|^\/[a-z0-9-]+\/$/)
  }
})

test('new entries default to hidden', () => {
  const app = defineApp({
    id: 'draft-tool',
    path: '/draft-tool/',
    name: 'Draft Tool',
    navLabel: { zh: '草稿', en: 'Draft' },
    description: { zh: '草稿工具', en: 'Draft tool' },
  })
  assert.equal(app.status, 'hidden')
})

test('stable selector excludes preview and hidden entries', () => {
  assert.ok(APP_STATUSES.includes('preview'))
  assert.ok(APP_STATUSES.includes('hidden'))
  assert.ok(getStableApps().every((app) => app.status === 'stable'))
})

test('manifest entries and nested public text are immutable', () => {
  const homepage = getAppById('homepage')
  assert.ok(homepage)
  assert.equal(homepage.navId, 'home')
  assert.ok(Object.isFrozen(homepage))
  assert.ok(Object.isFrozen(homepage.description))
})
