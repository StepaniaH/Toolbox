import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

const appRoot = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, appRoot), 'utf8')

test('monitor choice keeps its route shell and secure public links', () => {
  const html = read('index.html')
  assert.match(html, /id="toolbox-nav"/)
  assert.match(html, /id="sharp-ppd-meter"/)
  assert.match(html, /<script type="module" src="\.\/entry\.js"><\/script>/)
  assert.doesNotMatch(html, /<script src=/)
  assert.match(html, /data-toolbox-footer="monitor-choice"/)
  assert.match(read('entry.js'), /@toolbox\/nav\/toolbox-footer\.js/)
  assert.match(read('../../packages/nav/toolbox-footer.js'), /noopener noreferrer/)
})

test('every canvas exposes a localized text alternative', () => {
  const html = read('index.html')
  const canvases = [...html.matchAll(/<canvas\b[^>]*>/g)].map((match) => match[0])
  assert.equal(canvases.length, 7)
  for (const canvas of canvases) {
    assert.match(canvas, /role="img"/)
    assert.match(canvas, /data-i18n-aria="canvas\.[^"]+"/)
    assert.match(canvas, /aria-describedby="[^"]+"/)
  }
  assert.match(html, /data-i18n="canvas\.fallback"/)
})

test('bootstrap preserves the legacy dependency order', () => {
  const entry = read('entry.js')
  const imports = [
    './js/platform.js',
    '@toolbox/nav/nav-bar.js',
    './js/theme.js',
    './js/i18n.js',
    './js/i18n-zh.js',
    './js/i18n-en.js',
    './js/constants.js',
    './js/calc.js',
    './js/state.js',
    './js/data-scenarios.js',
    './js/data-panels.js',
    './js/tab-sharpness.js',
    './js/tab-size-view.js',
    './js/tab-color-lab.js',
    './js/tab-scenarios.js',
    './js/tab-panel-guide.js',
    './script.js',
  ]
  let previous = -1
  for (const specifier of imports) {
    const current = entry.indexOf(`'${specifier}'`)
    assert.ok(current > previous, `${specifier} is out of order`)
    previous = current
  }
})

test('monitor choice consumes shared runtimes instead of copied files', () => {
  const platform = read('js/platform.js')
  for (const specifier of [
    '@toolbox/nav/nav-bar.css',
    '@toolbox/theme/toggle.js',
    '@toolbox/i18n/core',
  ]) {
    assert.match(platform, new RegExp(specifier.replaceAll('/', '\\/')))
  }
  for (const copy of ['nav-bar.css', 'nav-bar.js', 'toggle.js']) {
    assert.equal(existsSync(new URL(copy, appRoot)), false)
  }
  assert.match(read('js/i18n.js'), /document\.documentElement\.lang/)
})

test('built monitor choice references emitted hashed assets', () => {
  const html = read('dist/index.html')
  const assets = [...html.matchAll(/(?:src|href)="(\/monitor-choice\/assets\/[^"]+)"/g)]
    .map((match) => match[1].replace('/monitor-choice/', 'dist/'))
  assert.ok(assets.length >= 2)
  for (const asset of assets) {
    assert.equal(existsSync(new URL(asset, appRoot)), true)
  }
  assert.ok(readdirSync(new URL('dist/assets/', appRoot)).some((name) => name.endsWith('.js')))
})

test('built stylesheet bundles every business stylesheet', () => {
  const cssAssets = readdirSync(new URL('dist/assets/', appRoot))
    .filter((name) => name.endsWith('.css'))
  assert.equal(cssAssets.length, 1)
  const css = read(`dist/assets/${cssAssets[0]}`)
  assert.doesNotMatch(css, /@import/)
  assert.doesNotMatch(css, /\.\/css\//)
  assert.doesNotMatch(css, /backdrop-filter/)
  for (const selector of [
    ':root',
    '.sharpness-panel',
    '.size-panel',
    '.color-panel',
    '.scenario-panel',
    '.panel-guide',
  ]) {
    assert.match(css, new RegExp(selector.replaceAll('.', '\\.')))
  }
})

const storage = new Map()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  },
  configurable: true,
})
globalThis.window = globalThis
const { default: compatibilityCalc } = await import('../js/calc.js?compatibility-test')
await import('../js/state.js?node-test')

test('calculation ESM keeps the legacy window bridge for existing tabs', () => {
  assert.equal(window.Calc, compatibilityCalc)
  assert.equal(typeof window.Calc.computePPI, 'function')
})

test('preferences use the namespaced key and read legacy saved data', () => {
  localStorage.clear()
  localStorage.setItem(window.AppState.LEGACY_STORAGE_KEY, JSON.stringify({ distance: 95 }))
  assert.equal(window.AppState.STORAGE_KEY, 'toolbox.monitor-choice.prefs.v1')
  assert.equal(window.AppState.hasSavedPreferences(), true)
  assert.equal(window.AppState.loadPreferences(), true)
  assert.equal(window.AppState.get('distance'), 95)
})

test('clearing preferences removes new and legacy storage', () => {
  localStorage.setItem(window.AppState.STORAGE_KEY, '{}')
  localStorage.setItem(window.AppState.LEGACY_STORAGE_KEY, '{}')
  window.AppState.clearPreferences()
  assert.equal(localStorage.getItem(window.AppState.STORAGE_KEY), null)
  assert.equal(localStorage.getItem(window.AppState.LEGACY_STORAGE_KEY), null)
})
