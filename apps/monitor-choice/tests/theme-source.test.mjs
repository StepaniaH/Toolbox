import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

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

test('theme css sources the palette from tokens and keeps canvas constants scoped', () => {
  const css = read('css/theme.css')
  assert.doesNotMatch(css, /--bg-base:\s*#/)
  assert.doesNotMatch(css, /--ctp-[a-z0-9-]+\s*:/)
  for (const derived of [
    '--bg-base: var(--color-bg)',
    '--accent-blue: var(--blue)',
    '--canvas-accent: var(--blue)',
    '--canvas-grid: color-mix',
  ]) {
    assert.ok(css.includes(derived), `missing ${derived}`)
  }
})

test('theme adapter delegates persistence to the shared runtime', () => {
  const source = read('js/theme.js')
  assert.match(source, /@toolbox\/theme|ToolboxTheme/)
  assert.match(source, /api\.STORAGE_KEY/)
  assert.doesNotMatch(source, /localStorage\.setItem\(\s*'toolbox-theme'/)
})
