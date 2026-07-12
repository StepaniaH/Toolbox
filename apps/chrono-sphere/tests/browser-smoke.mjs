import assert from 'node:assert/strict'
import { assertAppMarkStyle, assertDesktopSharedShell, assertMobileSharedShell } from '@toolbox/nav/browser-contract.mjs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const externalPreviewUrl = process.env.CHRONO_SPHERE_PREVIEW_URL
const previewUrl = externalPreviewUrl ?? 'http://127.0.0.1:19882/chrono-sphere/'
const preview = externalPreviewUrl
  ? null
  : spawn(
    process.execPath,
    [viteCli, 'preview', '--host', '127.0.0.1', '--port', '19882', '--strictPort'],
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
      // The production preview has not started listening yet.
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
  const context = await browser.newContext({
    locale: 'zh-CN',
    viewport: { width: 1440, height: 1100 },
  })
  const page = await context.newPage()
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
  assert.equal(await page.locator('.toolbox-app-icon').count() >= 1, true)
  assert.equal(await page.locator('.toolbox-footer').count(), 1)
  assert.equal(await page.locator('.toolbox-nav-hamburger').count(), 0)
  assert.equal(await page.locator('.toolbox-nav-theme-sun').count(), 1)
  assert.equal(await page.locator('.toolbox-nav-theme-moon').count(), 1)
  const compositingState = await page.evaluate(() => ({
    appTransform: getComputedStyle(document.querySelector('.app-container')).transform,
    tabsBackdrop: getComputedStyle(document.querySelector('.tabs-container')).backdropFilter,
    bodyBackgroundAttachment: getComputedStyle(document.body).backgroundAttachment,
  }))
  assert.equal(compositingState.appTransform, 'none')
  assert.equal(compositingState.tabsBackdrop, 'none')
  assert.equal(compositingState.bodyBackgroundAttachment.includes('fixed'), false)

  await page.getByRole('tab', { name: '日期区间计算' }).click()
  const absoluteTime = page.locator('.absolute-time-value')
  await absoluteTime.waitFor()
  assert.match((await absoluteTime.textContent()).trim(), /^-?\d+ 天 \d+ 小时$/)

  const languageButton = page.locator('.toolbox-nav-lang')
  await languageButton.click()
  const languageMenu = page.locator('.toolbox-nav-language-menu')
  await languageMenu.waitFor({ state: 'visible' })
  assert.equal(await languageMenu.isVisible(), true)
  assert.equal(
    await languageMenu.locator('[role="menuitemradio"][aria-checked="true"]').count(),
    1,
  )
  await languageMenu.locator('[role="menuitemradio"][lang="en"]').click()
  await page.waitForFunction(() => document.documentElement.lang === 'en')
  assert.match((await absoluteTime.textContent()).trim(), /^-?\d+ days \d+ hours$/)

  const themeBefore = await page.locator('html').getAttribute('data-theme')
  await page.locator('.toolbox-nav-theme').click()
  await page.waitForFunction(
    (previousTheme) => document.documentElement.getAttribute('data-theme') !== previousTheme,
    themeBefore,
  )

  await page.setViewportSize({ width: 390, height: 844 })
  await assertMobileSharedShell(page)
  assert.equal(await page.locator('.toolbox-nav-hamburger').count(), 0)
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  )
  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] ChronoSphere interval and shared shell passed')
} finally {
  await browser?.close()
  await stopPreview()
}
