import assert from 'node:assert/strict'
import { assertDesktopSharedShell, assertMobileSharedShell } from '@toolbox/nav/browser-contract.mjs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const previewUrl = 'http://127.0.0.1:19878/monitor-choice/'
const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', '19878', '--strictPort'],
  {
    cwd: appRoot,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)
let previewOutput = ''
preview.stdout.on('data', (chunk) => { previewOutput += chunk })
preview.stderr.on('data', (chunk) => { previewOutput += chunk })

async function waitForPreview() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (preview.exitCode !== null) {
      throw new Error(`preview exited early (${preview.exitCode})\n${previewOutput}`)
    }
    try {
      const response = await fetch(previewUrl)
      if (response.ok) return
    } catch {
      // The server has not started listening yet.
    }
    await delay(100)
  }
  throw new Error(`preview did not start\n${previewOutput}`)
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
  page.on('requestfailed', (request) => {
    runtimeFailures.push(`request failed: ${request.url()}`)
  })
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname
    if (response.status() >= 400 && pathname !== '/favicon.ico') {
      runtimeFailures.push(`response ${response.status()}: ${pathname}`)
    }
  })

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertDesktopSharedShell(page)
  const styleState = await page.evaluate(() => ({
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    textToken: getComputedStyle(document.documentElement)
      .getPropertyValue('--text-primary')
      .trim(),
  }))
  assert.notEqual(styleState.bodyBackground, 'rgba(0, 0, 0, 0)')
  assert.notEqual(styleState.textToken, '')

  const tabCases = [
    ['sharpness', 4],
    ['sizeView', 2],
    ['colorLab', 1],
    ['scenarios', 0],
    ['panelGuide', 0],
  ]
  for (const [tabId, expectedCanvasCount] of tabCases) {
    const button = page.locator(`.tab-nav-btn[data-tab="${tabId}"]`)
    assert.equal(await button.count(), 1)
    await button.click()
    assert.equal(await button.evaluate((element) => element.classList.contains('active')), true)

    const section = page.locator(`.tab-content[data-tab="${tabId}"]`)
    assert.equal(await section.count(), 1)
    assert.equal(await section.evaluate((element) => getComputedStyle(element).display !== 'none'), true)
    assert.ok((await section.textContent()).trim().length > 0)

    const canvases = section.locator('canvas')
    assert.equal(await canvases.count(), expectedCanvasCount)
    const canvasStates = await canvases.evaluateAll((elements) =>
      Array.from(elements).map((canvas) => ({
        width: canvas.width,
        height: canvas.height,
        label: canvas.getAttribute('aria-label'),
        describedBy: canvas.getAttribute('aria-describedby'),
      })),
    )
    for (const canvas of canvasStates) {
      assert.ok(canvas.width > 0)
      assert.ok(canvas.height > 0)
      assert.ok(canvas.label && !canvas.label.startsWith('canvas.'))
      assert.ok(canvas.describedBy)
    }
  }

  const languageButton = page.locator('.toolbox-nav-lang')
  assert.equal(await languageButton.count(), 1)
  const languageBefore = await page.locator('html').getAttribute('lang')
  await languageButton.focus()
  await page.keyboard.press('Enter')
  const languageMenu = page.locator('.toolbox-nav-language-menu')
  await languageMenu.waitFor({ state: 'visible' })
  assert.equal(await languageMenu.isVisible(), true)
  assert.equal(
    await languageMenu.locator('[role="menuitemradio"][aria-checked="true"]').count(),
    1,
  )
  const targetLanguage = languageBefore?.startsWith('zh') ? 'en' : 'zh'
  await languageMenu.locator(`[data-lang="${targetLanguage}"]`).click()
  const languageAfter = await page.locator('html').getAttribute('lang')
  assert.notEqual(languageAfter, languageBefore)

  const themeButton = page.locator('.toolbox-nav-theme')
  assert.equal(await themeButton.count(), 1)
  const themeBefore = await page.locator('html').getAttribute('data-theme')
  await themeButton.click()
  const themeAfter = await page.locator('html').getAttribute('data-theme')
  assert.notEqual(themeAfter, themeBefore)

  await page.setViewportSize({ width: 390, height: 844 })
  await assertMobileSharedShell(page)

  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] Monitor Choice production build passed')
} finally {
  await browser?.close()
  await stopPreview()
}
