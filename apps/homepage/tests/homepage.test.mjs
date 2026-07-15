import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import { getStableApps } from '@toolbox/app-manifest'

const appRoot = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, appRoot), 'utf8')

test('homepage keeps its public root shell and secure source link', () => {
  const html = read('index.html')
  assert.match(html, /id="toolbox-nav"/)
  assert.match(html, /id="tools-grid"/)
  assert.match(html, /<script type="module" src="\.\/js\/main\.js"><\/script>/)
  assert.match(html, /data-toolbox-footer="homepage"/)
  assert.match(read('js/main.js'), /@toolbox\/nav\/toolbox-footer\.js/)
  assert.match(read('../../packages/nav/toolbox-footer.js'), /noopener noreferrer/)
})

test('homepage lists every stable tool path exactly once', () => {
  const main = read('js/main.js')
  const apps = getStableApps().filter((app) => app.path !== '/')
  assert.deepEqual(apps.map((app) => app.path), [
    '/rate-lens/',
    '/chrono-sphere/',
    '/monitor-choice/',
    '/sane-units/',
    '/image-converter/',
    '/crypto-lab/',
  ])
  const presentationIds = [...main.matchAll(/^  "([a-z0-9-]+)": \{$/gm)]
    .map((match) => match[1])
  assert.deepEqual(presentationIds, apps.map((app) => app.id))
})

test('homepage consumes shared platform packages instead of copied runtimes', () => {
  const platform = read('js/platform.js')
  for (const specifier of [
    '@toolbox/theme/toggle.js',
    '@toolbox/nav/nav-bar.css',
    '@toolbox/nav/nav-bar.js',
    '@toolbox/i18n/core',
  ]) {
    assert.match(platform, new RegExp(specifier.replaceAll('/', '\\/')))
  }
  const adapterIndex = platform.indexOf('window.ToolboxI18n')
  const navLoadIndex = platform.indexOf("import('@toolbox/nav/nav-bar.js')")
  assert.ok(adapterIndex >= 0 && navLoadIndex > adapterIndex)
  for (const copy of ['nav-bar.css', 'nav-bar.js', 'toggle.js']) {
    assert.equal(existsSync(new URL(copy, appRoot)), false)
  }
})

test('homepage translations use the shared language state', () => {
  assert.match(read('js/i18n.js'), /from "@toolbox\/i18n\/core"/)
})

test('built homepage references only emitted hashed assets', () => {
  const html = read('dist/index.html')
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
    .map((match) => match[1])
  assert.ok(assets.length >= 2)
  for (const asset of assets) {
    assert.equal(existsSync(new URL(`dist${asset}`, appRoot)), true)
  }
  assert.ok(
    readdirSync(new URL('dist/assets/', appRoot))
      .some((name) => /^nav-bar-[\w-]+\.js$/.test(name)),
  )
})
