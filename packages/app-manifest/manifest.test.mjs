import assert from 'node:assert/strict'
import test from 'node:test'
import {
  APP_STATUSES,
  TOOLBOX_RELEASE,
  TOOLBOX_APPS,
  defineApp,
  getAppById,
  getStableApps,
} from './manifest.js'

test('manifest ids and paths are unique', () => {
  assert.equal(TOOLBOX_RELEASE, 'v0.5.0')
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
    keywords: { zh: ['草稿'], en: ['draft'] },
    icon: { viewBox: '0 0 24 24', svg: '<circle cx="12" cy="12" r="8"/>' },
  })
  assert.equal(app.status, 'hidden')
})

test('stable selector excludes preview and hidden entries', () => {
  assert.ok(APP_STATUSES.includes('preview'))
  assert.ok(APP_STATUSES.includes('hidden'))
  assert.ok(getStableApps().every((app) => app.status === 'stable'))
})

test('homepage card visibility is part of the presentation contract', () => {
  for (const app of getStableApps()) {
    if (app.path === '/') continue
    assert.equal(
      app.presentation.card,
      app.id !== 'settings',
      `${app.id} must declare the expected homepage card flag`,
    )
  }
})

test('manifest entries and nested public text are immutable', () => {
  const homepage = getAppById('homepage')
  assert.ok(homepage)
  assert.equal(homepage.navId, 'home')
  assert.ok(Object.isFrozen(homepage))
  assert.ok(Object.isFrozen(homepage.description))
  assert.ok(Object.isFrozen(homepage.keywords))
  assert.ok(Object.isFrozen(homepage.keywords.zh))
  assert.ok(TOOLBOX_APPS.every((app) => app.keywords.zh.length > 0 && app.keywords.en.length > 0))
  assert.ok(Object.isFrozen(homepage.icon))
  assert.match(homepage.icon.svg, /<path/)
})

test('stable tools carry an immutable bilingual card presentation', () => {
  for (const app of getStableApps()) {
    if (app.path === '/') continue
    const presentation = app.presentation
    assert.ok(presentation, `${app.id} needs card presentation`)
    assert.ok(Object.isFrozen(presentation))
    assert.ok(presentation.subtitle.zh.length > 0 && presentation.subtitle.en.length > 0)
    assert.ok(presentation.description.zh.length > 0 && presentation.description.en.length > 0)
    assert.ok(Object.isFrozen(presentation.badges))
    assert.ok(presentation.badges.length > 0)
  }
})
