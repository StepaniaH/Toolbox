import assert from 'node:assert/strict'
import { assertAppMarkStyle, assertDesktopSharedShell, assertMobileSharedShell, assertSharedPreferenceMatrix } from '@toolbox/nav/browser-contract.mjs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const externalPreviewUrl = process.env.SANE_UNITS_PREVIEW_URL
const previewUrl = externalPreviewUrl ?? 'http://127.0.0.1:19879/sane-units/'
const preview = externalPreviewUrl
  ? null
  : spawn(
    process.execPath,
    [viteCli, 'preview', '--host', '127.0.0.1', '--port', '19879', '--strictPort'],
    {
      cwd: appRoot,
      env: { ...process.env, NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
let previewOutput = ''
preview?.stdout.on('data', (chunk) => { previewOutput += chunk })
preview?.stderr.on('data', (chunk) => { previewOutput += chunk })

async function waitForPreview() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (preview?.exitCode !== null && preview?.exitCode !== undefined) {
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
  if (!preview || preview.exitCode !== null) return
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
  page.on('requestfailed', (request) => runtimeFailures.push(`request failed: ${request.url()}`))
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname
    if (response.status() >= 400 && pathname !== '/favicon.ico') {
      runtimeFailures.push(`response ${response.status()}: ${pathname}`)
    }
  })

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertDesktopSharedShell(page)
  await assertAppMarkStyle(page)
  const styleState = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    return {
      background: rootStyle.getPropertyValue('--color-bg').trim(),
      border: rootStyle.getPropertyValue('--color-border').trim(),
      text: rootStyle.getPropertyValue('--color-text').trim(),
      font: rootStyle.getPropertyValue('--font-sans').trim(),
      radius: rootStyle.getPropertyValue('--radius-sm').trim(),
    }
  })
  for (const tokenValue of Object.values(styleState)) assert.notEqual(tokenValue, '')

  assert.equal(await page.locator('.toolbox-nav-theme').count(), 1)
  assert.equal(await page.locator('.toolbox-nav-lang').count(), 1)
  assert.equal(await page.locator('.control-btn, .sidebar-controls, .mobile-controls').count(), 0)
  assert.equal(await page.locator('.sidebar, .mobile-topbar').count(), 0)
  assert.equal(await page.locator('.sane-app-header').isVisible(), true)
  assert.equal(await page.locator('.section-nav').isVisible(), true)

  const routeCases = [
    ['/storage', 7],
    ['/network', 7],
    ['/video', 7],
    ['/power', 7],
    ['/about', 3],
  ]
  const storageLink = page.locator('.section-nav a[href="/storage"]')
  assert.equal(await storageLink.count(), 1)
  await storageLink.click()
  const assertStorageSurface = async () => {
    assert.equal(await page.locator('.calculator-grid-storage').count(), 1)
    assert.equal(await page.locator('.panel').count(), 7)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    )
  }
  await assertSharedPreferenceMatrix(page, assertStorageSurface)
  for (const [route, expectedPanels] of routeCases) {
    const link = page.locator(`.section-nav a[href="${route}"]`)
    assert.equal(await link.count(), 1)
    await link.click()
    assert.ok((await page.locator('.page-header h2').textContent()).trim().length > 0)
    assert.equal(await page.locator('.panel').count(), expectedPanels)
  }

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  const languageButton = page.locator('.toolbox-nav-lang')
  const languageBefore = await page.locator('html').getAttribute('lang')
  const copyBefore = await page.locator('.brand-subtitle').textContent()
  await languageButton.click()
  const languageMenu = page.locator('.toolbox-nav-language-menu')
  await languageMenu.waitFor({ state: 'visible' })
  assert.equal(await languageMenu.isVisible(), true)
  assert.equal(
    await languageMenu.locator('[role="menuitemradio"][aria-checked="true"]').count(),
    1,
  )
  const targetLanguage = languageBefore?.startsWith('zh') ? 'en' : 'zh'
  await languageMenu.locator(`[data-lang="${targetLanguage}"]`).click()
  await page.waitForFunction(
    (previousLanguage) => document.documentElement.lang !== previousLanguage,
    languageBefore,
  )
  assert.notEqual(await page.locator('html').getAttribute('lang'), languageBefore)
  assert.notEqual(await page.locator('.brand-subtitle').textContent(), copyBefore)

  const themeButton = page.locator('.toolbox-nav-theme')
  const themeBefore = await page.locator('html').getAttribute('data-theme')
  const backgroundBefore = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(),
  )
  await themeButton.click()
  await page.waitForFunction(
    (previousTheme) => document.documentElement.getAttribute('data-theme') !== previousTheme,
    themeBefore,
  )
  assert.notEqual(await page.locator('html').getAttribute('data-theme'), themeBefore)
  assert.notEqual(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(),
    ),
    backgroundBefore,
  )

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertMobileSharedShell(page)
  await page.locator('.section-nav a[href="/storage"]').click()
  await assertSharedPreferenceMatrix(page, assertStorageSurface)
  assert.equal(await page.locator('.sidebar, .mobile-topbar').count(), 0)
  assert.equal(await page.locator('.sane-app-header').isVisible(), true)
  assert.equal(await page.locator('.section-nav').isVisible(), true)
  assert.equal(await page.locator('.toolbox-nav-theme').count(), 1)
  assert.equal(await page.locator('.toolbox-nav-lang').count(), 1)
  assert.equal(await page.locator('.toolbox-nav-hamburger').count(), 0)
  const brandButton = page.locator('.toolbox-nav-brand-btn')
  await brandButton.click()
  const toolMenu = page.locator('.toolbox-nav-dropdown-menu')
  await toolMenu.waitFor({ state: 'visible' })
  assert.equal(await brandButton.getAttribute('aria-expanded'), 'true')
  await page.keyboard.press('Escape')
  await page.mouse.move(389, 843)
  await toolMenu.waitFor({ state: 'hidden' })

  for (const [route, expectedPanels] of routeCases) {
    const link = page.locator(`.section-nav a[href="${route}"]`)
    assert.equal(await link.count(), 1)
    await link.click()
    assert.equal(await page.locator('.panel').count(), expectedPanels)
  }
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  )

  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] SaneUnits production build passed')
} finally {
  await browser?.close()
  await stopPreview()
}
