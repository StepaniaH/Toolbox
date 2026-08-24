import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  applyHomepagePrefs,
  normalizeHomepagePrefs,
  readHomepagePrefs,
  writeHomepagePrefs,
  HOMEPAGE_PREFS_STORAGE_KEY,
  PREFS_CONTRACT_VERSION,
} from './prefs.mjs'

const APPS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
const IDS = ['a', 'b', 'c']

test('normalize drops unknown and duplicate ids and clamps limit', () => {
  const prefs = normalizeHomepagePrefs(
    { hiddenIds: ['a', 'zz', 'a'], order: ['c', 'b', 'c', 'nope'], limit: 99 },
    IDS,
  )
  assert.deepEqual(prefs.hiddenIds, ['a'])
  assert.deepEqual(prefs.order, ['c', 'b'])
  assert.equal(prefs.limit, IDS.length)
  assert.equal(prefs.schema, 1)
})

test('apply orders pinned apps first then manifest order, hides and limits', () => {
  const prefs = normalizeHomepagePrefs({ order: ['c'], hiddenIds: ['a'], limit: 1 }, IDS)
  assert.deepEqual(applyHomepagePrefs(APPS, prefs).map((app) => app.id), ['c'])
  const open = normalizeHomepagePrefs({ order: ['c'] }, IDS)
  assert.deepEqual(applyHomepagePrefs(APPS, open).map((app) => app.id), ['c', 'a', 'b'])
})

function memoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
}

test('read falls back to defaults on corrupt storage and write round-trips', () => {
  const storage = memoryStorage({ [HOMEPAGE_PREFS_STORAGE_KEY]: '{oops' })
  assert.deepEqual(readHomepagePrefs(IDS, storage), normalizeHomepagePrefs(null, IDS))

  const written = writeHomepagePrefs({ hiddenIds: ['b'], limit: 2 }, IDS, storage)
  assert.deepEqual(written, normalizeHomepagePrefs({ hiddenIds: ['b'], limit: 2 }, IDS))
  assert.deepEqual(readHomepagePrefs(IDS, storage), written)
})

test('contract version stays in sync with the package declaration', () => {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  assert.equal(PREFS_CONTRACT_VERSION, pkg.contractVersion)
})
