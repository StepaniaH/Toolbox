import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import {
  DEFAULT_THEME,
  FOUNDATION_TOKENS,
  isTheme,
  SEMANTIC_COLOR_TOKENS,
  THEME_ATTRIBUTE,
  THEME_CONTRACT_VERSION,
  THEMES,
  THEME_STORAGE_KEY,
} from './contract.mjs'

const css = await readFile(new URL('./index.css', import.meta.url), 'utf8')
const runtime = await readFile(new URL('./toggle.js', import.meta.url), 'utf8')

function ruleBody(selector) {
  const start = css.indexOf(selector)
  assert.notEqual(start, -1, `missing selector ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

function tokensIn(body) {
  return new Set([...body.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]))
}

function createHarness({ initialTheme, prefersLight = false, storedTheme, storageFailure } = {}) {
  const attributes = new Map()
  if (initialTheme) attributes.set(THEME_ATTRIBUTE, initialTheme)
  const values = new Map()
  if (storedTheme !== undefined) values.set(THEME_STORAGE_KEY, storedTheme)

  const localStorage = {
    getItem(key) {
      if (storageFailure === 'get') throw new Error('storage unavailable')
      return values.get(key) ?? null
    },
    setItem(key, value) {
      if (storageFailure === 'set') throw new Error('storage unavailable')
      values.set(key, value)
    },
  }
  const document = {
    documentElement: {
      getAttribute(name) {
        return attributes.get(name) ?? null
      },
      setAttribute(name, value) {
        attributes.set(name, value)
      },
    },
  }
  const window = {
    document,
    localStorage,
    matchMedia: () => ({ matches: prefersLight }),
  }
  vm.runInNewContext(runtime, { window })

  return {
    api: window.ToolboxTheme,
    attributes,
    document,
    localStorage,
    values,
    window,
  }
}

test('publishes an immutable v1 theme contract', () => {
  assert.equal(THEME_CONTRACT_VERSION, 1)
  assert.equal(THEME_STORAGE_KEY, 'toolbox-theme')
  assert.equal(THEME_ATTRIBUTE, 'data-theme')
  assert.equal(DEFAULT_THEME, 'dark')
  assert.deepEqual(THEMES, ['dark', 'light'])
  assert.equal(Object.isFrozen(THEMES), true)
  assert.equal(Object.isFrozen(SEMANTIC_COLOR_TOKENS), true)
  assert.equal(Object.isFrozen(FOUNDATION_TOKENS), true)
  assert.equal(isTheme('light'), true)
  assert.equal(isTheme('system'), false)
})

test('defines every semantic token for dark and light themes', () => {
  const darkTokens = tokensIn(ruleBody(':root,\n:root[data-theme="dark"]'))
  const lightTokens = tokensIn(ruleBody(':root[data-theme="light"]'))
  for (const token of SEMANTIC_COLOR_TOKENS) {
    assert.equal(darkTokens.has(token), true, `dark is missing ${token}`)
    assert.equal(lightTokens.has(token), true, `light is missing ${token}`)
  }
})

test('defines every theme-independent foundation token', () => {
  for (const token of FOUNDATION_TOKENS) {
    assert.match(css, new RegExp(`${token.replaceAll('-', '\\-')}\\s*:`))
  }
})

test('keeps the Catppuccin palette anchors stable', () => {
  const dark = ruleBody(':root,\n:root[data-theme="dark"]')
  const light = ruleBody(':root[data-theme="light"]')
  assert.match(dark, /--ctp-base:\s*#303446;/)
  assert.match(dark, /--ctp-text:\s*#c6d0f5;/)
  assert.match(dark, /--ctp-blue:\s*#8caaee;/)
  assert.match(light, /--ctp-base:\s*#eff1f5;/)
  assert.match(light, /--ctp-text:\s*#4c4f69;/)
  assert.match(light, /--ctp-blue:\s*#1e66f5;/)
})

test('runtime metadata matches the public contract', () => {
  const { api } = createHarness()
  assert.equal(api.CONTRACT_VERSION, THEME_CONTRACT_VERSION)
  assert.equal(api.STORAGE_KEY, THEME_STORAGE_KEY)
  assert.equal(api.ATTRIBUTE, THEME_ATTRIBUTE)
  assert.equal(api.DEFAULT_THEME, DEFAULT_THEME)
  assert.deepEqual([...api.THEMES], THEMES)
})

test('stored theme takes precedence over the system preference', () => {
  const { api } = createHarness({ storedTheme: 'dark', prefersLight: true })
  assert.equal(api.getTheme(), 'dark')
})

test('system preference is the fallback and dark is the final default', () => {
  assert.equal(createHarness({ prefersLight: true }).api.getTheme(), 'light')
  assert.equal(createHarness().api.getTheme(), 'dark')
  assert.equal(createHarness({ storedTheme: 'invalid' }).api.getTheme(), 'dark')
})

test('setTheme persists and applies valid themes', () => {
  const { api, attributes, values } = createHarness()
  assert.equal(api.setTheme('light'), 'light')
  assert.equal(values.get(THEME_STORAGE_KEY), 'light')
  assert.equal(attributes.get(THEME_ATTRIBUTE), 'light')
  assert.throws(() => api.setTheme('system'), /expected "dark" or "light"/)
})

test('toggleTheme follows the DOM attribute and repairs missing state', () => {
  const fromDom = createHarness({ initialTheme: 'light', storedTheme: 'light' })
  assert.equal(fromDom.api.toggleTheme(), 'dark')
  assert.equal(fromDom.attributes.get(THEME_ATTRIBUTE), 'dark')

  const fromFallback = createHarness({ storedTheme: 'dark' })
  assert.equal(fromFallback.api.toggleTheme(), 'light')
  assert.equal(fromFallback.attributes.get(THEME_ATTRIBUTE), 'light')
})

test('storage failures do not prevent runtime theme application', () => {
  const readFailure = createHarness({ storageFailure: 'get', prefersLight: true })
  assert.equal(readFailure.api.getTheme(), 'light')

  const writeFailure = createHarness({ storageFailure: 'set' })
  assert.equal(writeFailure.api.setTheme('light'), 'light')
  assert.equal(writeFailure.attributes.get(THEME_ATTRIBUTE), 'light')
})

test('pre-paint script applies stored, system, and safe fallback themes', () => {
  for (const scenario of [
    { storedTheme: 'light', expected: 'light' },
    { storedTheme: undefined, prefersLight: true, expected: 'light' },
    { storedTheme: 'invalid', expected: 'dark' },
    { storageFailure: 'get', prefersLight: true, expected: 'dark' },
  ]) {
    const harness = createHarness(scenario)
    vm.runInNewContext(harness.api.prePaintScript(), {
      document: harness.document,
      localStorage: harness.localStorage,
      window: harness.window,
    })
    assert.equal(harness.attributes.get(THEME_ATTRIBUTE), scenario.expected)
  }
})
