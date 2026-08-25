import assert from 'node:assert/strict'
import { assertDesktopSharedShell, assertMobileSharedShell, assertSharedPreferenceMatrix } from '@toolbox/nav/browser-contract.mjs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const port = process.env.SMOKE_PORT ?? '25203'
const previewUrl = `http://127.0.0.1:${port}/settings/`
const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  {
    cwd: appRoot,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)

async function waitForPreview() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(previewUrl)
      if (response.ok) return
    } catch {
      // The production preview has not started listening yet.
    }
    await delay(100)
  }
  throw new Error('preview did not start')
}

async function stopPreview() {
  if (preview.exitCode !== null) return
  preview.kill('SIGTERM')
  await Promise.race([once(preview, 'exit'), delay(2000)])
  if (preview.exitCode === null) preview.kill('SIGKILL')
}

let browser
try {
  await waitForPreview()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  const runtimeFailures = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      runtimeFailures.push(`console ${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => runtimeFailures.push(`pageerror: ${error.message}`))

  const assertAppSurface = async () => {
    assert.equal(await page.locator('main.page').count(), 1)
    const heading = await page.locator('h1').first().textContent()
    assert.ok(heading && heading.trim().length > 0)
  }

  const bodyBackground = () =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  // Wait out the shared 0.3s body color transition before sampling.
  const waitForBackground = (expected) =>
    page.waitForFunction(
      (rgb) => getComputedStyle(document.body).backgroundColor === rgb,
      expected,
    )

  await page.goto(previewUrl, { waitUntil: 'networkidle' })

  // The fixed nav bar must never cover the page title.
  const titleBox = await page.locator('h1').first().boundingBox()
  assert.ok(titleBox && titleBox.y >= 56, 'settings title must clear the 56px fixed nav')

  // Translations must render as copy, never as raw dotted keys.
  const bodyText = await page.locator('body').textContent()
  for (const banned of ['brand.', 'appearance.', 'homepage.']) {
    assert.ok(!bodyText.includes(banned), `raw key prefix leaked into UI: ${banned}`)
  }

  // Palette families: dark Gruvbox and Solarized must actually restyle the page.
  // Headless Chromium reports prefers-color-scheme: light, so pick dark first.
  const segments = page.locator('.segment')
  assert.deepEqual(await segments.allTextContents(), ['Dark', 'Light'])
  await segments.first().click()
  await waitForBackground('rgb(48, 52, 70)')

  const swatches = page.locator('.swatch')
  assert.equal(await swatches.count(), 3)
  await swatches.filter({ hasText: 'Gruvbox' }).click()
  await waitForBackground('rgb(40, 40, 40)')
  assert.equal(await page.getAttribute('html', 'data-theme-family'), 'gruvbox')

  await page.locator('.segment', { hasText: 'Light' }).click()
  await waitForBackground('rgb(251, 241, 199)')

  await swatches.filter({ hasText: 'Solarized' }).click()
  await page.locator('.segment', { hasText: 'Dark' }).click()
  await waitForBackground('rgb(0, 43, 54)')
  assert.equal(await page.getAttribute('html', 'data-theme-family'), 'solarized')
  assert.equal(await page.getAttribute('html', 'data-theme'), 'dark')

  // The language dropdown localizes the whole page instantly and persists.
  await page.locator('.language-select').selectOption('zh')
  await page.waitForFunction(() => document.documentElement.lang === 'zh-CN')
  assert.equal(await page.locator('h1').first().textContent(), '设置')

  // Reordering must visibly swap adjacent rows and persist the new order.
  const visibleNames = page.locator('.tool-row:not(.is-hidden) .tool-name')
  const namesBefore = await visibleNames.allTextContents()
  await page.locator('button[aria-label="下移"]').first().click()
  const namesAfter = await visibleNames.allTextContents()
  assert.equal(namesAfter[0], namesBefore[1])
  assert.equal(namesAfter[1], namesBefore[0])
  await page.locator('button[aria-label="上移"]').nth(1).click()
  assert.deepEqual(await visibleNames.allTextContents(), namesBefore)

  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(await page.getAttribute('html', 'data-theme-family'), 'solarized')
  assert.equal(await page.getAttribute('html', 'data-theme'), 'dark')
  assert.equal((await bodyBackground()), 'rgb(0, 43, 54)')
  assert.equal(await page.locator('h1').first().textContent(), '设置')

  await assertDesktopSharedShell(page)
  await assertSharedPreferenceMatrix(page, assertAppSurface)

  await page.setViewportSize({ width: 390, height: 844 })
  await assertMobileSharedShell(page)
  await assertSharedPreferenceMatrix(page, assertAppSurface)

  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] Settings production shell passed')
} finally {
  await browser?.close()
  await stopPreview()
}
