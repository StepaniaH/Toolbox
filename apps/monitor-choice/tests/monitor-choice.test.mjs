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
  assert.match(html, /rel="noopener noreferrer"/)
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

globalThis.window = globalThis
await import('../js/calc.js?node-test')

test('4K at 32 inches has the expected pixel density', () => {
  assert.ok(Math.abs(window.Calc.computePPI(3840, 2160, 32) - 137.68) < 0.01)
})

test('invalid diagonal returns zero PPI', () => {
  assert.equal(window.Calc.computePPI(3840, 2160, 0), 0)
})

test('16:9 dimensions preserve the requested diagonal', () => {
  const dimensions = window.Calc.resolveDimensions(32, '16:9')
  const diagonal = Math.hypot(dimensions.widthCm, dimensions.heightCm) / 2.54
  assert.ok(Math.abs(diagonal - 32) < 1e-10)
})

test('interface bandwidth calculation uses decimal Gbps', () => {
  assert.equal(window.Calc.computeInterfaceBandwidth(3840, 2160, 60, 10), 4.97664)
})
