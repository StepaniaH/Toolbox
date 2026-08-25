import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { getStableApps } from '@toolbox/app-manifest'

const appRoot = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, appRoot), 'utf8')

function loadPrePaintScript() {
  const runtime = read('../../packages/theme/toggle.js')
  const window = {}
  vm.runInNewContext(runtime, { window })
  return window.ToolboxTheme.prePaintScript()
}

test('index.html embeds the canonical pre-paint snippet verbatim', () => {
  const html = read('index.html')
  const match = html.match(/<script>([\s\S]*?)<\/script>/)
  assert.ok(match, 'inline pre-paint script missing from index.html')
  assert.equal(match[1], loadPrePaintScript())
})

test('homepage keeps its public root shell and secure source link', () => {
  const html = read('index.html')
  assert.match(html, /id="toolbox-nav"/)
  assert.match(html, /id="tools-grid"/)
  assert.match(html, /<script type="module" src="\.\/js\/main\.js"><\/script>/)
  assert.match(html, /data-toolbox-footer="homepage"/)
  assert.match(read('js/main.js'), /@toolbox\/nav\/toolbox-footer\.js/)
  assert.match(read('../../packages/nav/toolbox-footer.js'), /noopener noreferrer/)
})

test('homepage renders every stable tool from the manifest presentation contract', () => {
  const main = read('js/main.js')
  const apps = getStableApps().filter(
    (app) => app.path !== '/' && app.presentation.card !== false,
  )
  assert.ok(apps.length >= 1)
  for (const app of apps) {
    assert.ok(app.presentation, `${app.id} must carry its card presentation in the manifest`)
    for (const lang of ['zh', 'en']) {
      assert.ok(app.presentation.subtitle[lang], `${app.id} needs a ${lang} subtitle`)
      assert.ok(app.presentation.description[lang], `${app.id} needs a ${lang} description`)
    }
    assert.ok(app.presentation.badges.length > 0, `${app.id} needs card badges`)
  }
  assert.equal(
    getStableApps().find((app) => app.id === 'settings')?.presentation.card,
    false,
    'settings is a preference surface, not a homepage card',
  )
  assert.match(main, /registerCardStrings/)
  assert.match(main, /presentation/)
  assert.match(main, /card !== false/)
  assert.doesNotMatch(main, /CARD_PRESENTATION/)
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
