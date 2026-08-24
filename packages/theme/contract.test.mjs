import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import {
  DEFAULT_THEME,
  DEFAULT_THEME_FAMILY,
  FOUNDATION_TOKENS,
  isTheme,
  isThemeFamily,
  SEMANTIC_COLOR_TOKENS,
  THEME_ATTRIBUTE,
  THEME_CONTRACT_VERSION,
  THEME_FAMILIES,
  THEME_FAMILY_ATTRIBUTE,
  THEME_FAMILY_STORAGE_KEY,
  THEMES,
  THEME_STORAGE_KEY,
} from './contract.mjs'

const css = await readFile(new URL('./tokens.css', import.meta.url), 'utf8')
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

test('publishes an immutable v2 theme contract', () => {
  assert.equal(THEME_CONTRACT_VERSION, 2)
  assert.equal(THEME_STORAGE_KEY, 'toolbox-theme')
  assert.equal(THEME_ATTRIBUTE, 'data-theme')
  assert.equal(DEFAULT_THEME, 'dark')
  assert.deepEqual(THEMES, ['dark', 'light'])
  assert.equal(Object.isFrozen(THEMES), true)
  assert.equal(Object.isFrozen(SEMANTIC_COLOR_TOKENS), true)
  assert.equal(Object.isFrozen(FOUNDATION_TOKENS), true)
  assert.equal(isTheme('light'), true)
  assert.equal(isTheme('system'), false)
  assert.equal(THEME_FAMILY_STORAGE_KEY, 'toolbox-theme-family')
  assert.equal(THEME_FAMILY_ATTRIBUTE, 'data-theme-family')
  assert.equal(DEFAULT_THEME_FAMILY, 'catppuccin')
  assert.deepEqual([...THEME_FAMILIES], ['catppuccin', 'gruvbox', 'solarized'])
  assert.equal(Object.isFrozen(THEME_FAMILIES), true)
  assert.equal(isThemeFamily('gruvbox'), true)
  assert.equal(isThemeFamily('dracula'), false)
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
    assert.equal(harness.attributes.get(THEME_FAMILY_ATTRIBUTE), DEFAULT_THEME_FAMILY)
  }
})

test('pre-paint script resolves the stored palette family with a safe fallback', () => {
  const harness = createHarness({ storedTheme: 'dark' })
  harness.values.set(THEME_FAMILY_STORAGE_KEY, 'gruvbox')
  vm.runInNewContext(harness.api.prePaintScript(), {
    document: harness.document,
    localStorage: harness.localStorage,
    window: harness.window,
  })
  assert.equal(harness.attributes.get(THEME_FAMILY_ATTRIBUTE), 'gruvbox')

  const broken = createHarness({})
  broken.values.set(THEME_FAMILY_STORAGE_KEY, 'dracula')
  vm.runInNewContext(broken.api.prePaintScript(), {
    document: broken.document,
    localStorage: broken.localStorage,
    window: broken.window,
  })
  assert.equal(broken.attributes.get(THEME_FAMILY_ATTRIBUTE), DEFAULT_THEME_FAMILY)
})

test('setThemeFamily persists valid families and rejects unknown ones', () => {
  const { api, attributes, values } = createHarness()
  assert.equal(api.setThemeFamily('solarized'), 'solarized')
  assert.equal(values.get(THEME_FAMILY_STORAGE_KEY), 'solarized')
  assert.equal(attributes.get(THEME_FAMILY_ATTRIBUTE), 'solarized')
  assert.equal(api.getThemeFamily(), 'solarized')
  assert.throws(() => api.setThemeFamily('nord'), /unexpected family/)
})

test('runtime metadata matches the public contract', () => {
  const { api } = createHarness()
  assert.equal(api.CONTRACT_VERSION, THEME_CONTRACT_VERSION)
  assert.equal(api.STORAGE_KEY, THEME_STORAGE_KEY)
  assert.equal(api.ATTRIBUTE, THEME_ATTRIBUTE)
  assert.equal(api.DEFAULT_THEME, DEFAULT_THEME)
  assert.deepEqual([...api.THEMES], THEMES)
  assert.equal(api.FAMILY_STORAGE_KEY, THEME_FAMILY_STORAGE_KEY)
  assert.equal(api.FAMILY_ATTRIBUTE, THEME_FAMILY_ATTRIBUTE)
  assert.equal(api.DEFAULT_THEME_FAMILY, DEFAULT_THEME_FAMILY)
  assert.deepEqual([...api.THEME_FAMILIES], [...THEME_FAMILIES])
})

// ── Family palette coverage and contrast gates ───────────────

function blockFor(selector) {
  const start = css.indexOf(selector)
  assert.notEqual(start, -1, `missing selector ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

function hexMap(body) {
  const map = new Map()
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) {
    map.set(match[1], match[2])
  }
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*var\((--[a-z0-9-]+)\)/g)) {
    map.set(match[1], `var:${match[2]}`)
  }
  return map
}

function resolve(map, token, depth = 0) {
  let value = map.get(token)
  while (typeof value === 'string' && value.startsWith('var:') && depth < 4) {
    value = map.get(value.slice(4))
    depth += 1
  }
  return typeof value === 'string' && value.startsWith('#') ? value : null
}

function luminance(hex) {
  const full = hex.length === 4 ? hex.replace(/[^#]/g, '').split('').map((c) => c + c).join('') : hex
  const channel = (index) => {
    const value = parseInt(full.slice(index, index + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function contrastRatio(foreground, background) {
  const a = luminance(foreground)
  const b = luminance(background)
  const [hi, lo] = a >= b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

const FAMILY_BLOCKS = [
  ['catppuccin', 'dark', ':root,\n:root[data-theme="dark"]'],
  ['catppuccin', 'light', ':root[data-theme="light"]'],
  ['gruvbox', 'dark', '[data-theme-family="gruvbox"] \n'],
  ['gruvbox', 'light', '[data-theme-family="gruvbox"][data-theme="light"]'],
  ['solarized', 'dark', '[data-theme-family="solarized"] \n'],
  ['solarized', 'light', '[data-theme-family="solarized"][data-theme="light"]'],
]

test('every family and mode defines the complete raw palette', () => {
  for (const [family, mode, selector] of FAMILY_BLOCKS) {
    const map = hexMap(blockFor(selector.trim()))
    void map
    for (const token of ['--ctp-base', '--ctp-text', '--ctp-blue', '--ctp-red', '--ctp-green', '--ctp-surface-0']) {
      assert.ok(resolve(map, token), `${family}/${mode} is missing ${token}`)
    }
  }
})

test('core text pairs meet WCAG contrast in every family and mode', () => {
  const requirements = [
    ['--color-text', '--color-bg', 4.5],
    ['--color-text-muted', '--color-bg', 4.0],
    ['--color-primary-fg', '--color-primary', 3.0],
    ['--color-danger-fg', '--color-danger', 3.0],
  ]
  const defaultBlocks = {
    dark: hexMap(blockFor(':root,\n:root[data-theme="dark"]')),
    light: hexMap(blockFor(':root[data-theme="light"]')),
  }
  for (const [family, mode, selector] of FAMILY_BLOCKS) {
    const base = family === 'catppuccin' ? defaultBlocks[mode] : defaultBlocks[mode]
    const familyMap = family === 'catppuccin' ? new Map() : hexMap(blockFor(selector.trim()))
    const map = new Map([...base, ...familyMap])
    for (const [fgToken, bgToken, minimum] of requirements) {
      const fg = resolve(map, fgToken)
      const bg = resolve(map, bgToken)
      assert.ok(fg && bg, `${family}/${mode} cannot resolve ${fgToken}/${bgToken}`)
      const ratio = contrastRatio(fg, bg)
      assert.ok(
        ratio >= minimum,
        `${family}/${mode} ${fgToken} on ${bgToken} is ${ratio.toFixed(2)} (< ${minimum})`,
      )
    }
  }
})
