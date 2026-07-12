import assert from 'node:assert/strict'
import { assertDesktopSharedShell, assertMobileSharedShell, assertSharedPreferenceMatrix } from '@toolbox/nav/browser-contract.mjs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const previewUrl = 'http://127.0.0.1:19883/'
const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', '19883', '--strictPort'],
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
      // The production preview has not started listening yet.
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
  const page = await browser.newPage({
    locale: 'zh-CN',
    viewport: { width: 1440, height: 1100 },
  })
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
  const assertHomepageSurface = async () => {
    assert.equal(await page.locator('.tool-card').count(), 4)
    assert.equal(await page.locator('.tool-card .toolbox-app-icon').count(), 4)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    )
  }
  await assertSharedPreferenceMatrix(page, assertHomepageSurface)
  assert.equal(await page.locator('.tool-card').count(), 4)
  assert.equal(await page.locator('.tool-card .toolbox-app-icon').count(), 4)
  assert.equal(await page.locator('.toolbox-footer').count(), 1)
  assert.equal(await page.getByText('v0.2.4', { exact: true }).count(), 1)
  assert.equal(await page.locator('.toolbox-nav-hamburger').count(), 0)
  assert.equal(await page.locator('.toolbox-nav-brand-link').getAttribute('href'), '/')

  const languageButton = page.locator('.toolbox-nav-lang')
  const titleBefore = await page.locator('.site-title').textContent()
  await languageButton.focus()
  await page.keyboard.press('Enter')
  const languageMenu = page.locator('.toolbox-nav-language-menu')
  await languageMenu.waitFor({ state: 'visible' })
  assert.equal(
    await languageMenu.locator('[role="menuitemradio"][aria-checked="true"]').count(),
    1,
  )
  await languageMenu.locator('[data-lang="en"]').click()
  await page.waitForFunction(() => document.documentElement.lang === 'en')
  assert.notEqual(await page.locator('.site-title').textContent(), titleBefore)
  assert.equal(await page.locator('.toolbox-footer-description').textContent(), 'Toolbox navigation hub')

  const toolMenuButton = page.locator('.toolbox-nav-menu-btn')
  await toolMenuButton.click()
  const toolSearch = page.locator('.toolbox-nav-search-input')
  await toolSearch.fill('timezone')
  assert.equal(await page.locator('.toolbox-nav-dropdown-item:visible').count(), 1)
  assert.match(await page.locator('.toolbox-nav-dropdown-item:visible').textContent(), /ChronoSphere/)
  await toolSearch.fill('not-a-real-tool')
  assert.equal(await page.locator('.toolbox-nav-search-empty:visible').textContent(), 'No matching tools')
  await page.keyboard.press('Escape')

  const themeBefore = await page.locator('html').getAttribute('data-theme')
  const backgroundBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  await page.locator('.toolbox-nav-theme').click()
  await page.waitForFunction(
    (previousTheme) => document.documentElement.getAttribute('data-theme') !== previousTheme,
    themeBefore,
  )
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), backgroundBefore)

  await page.setViewportSize({ width: 390, height: 844 })
  await assertMobileSharedShell(page)
  await assertSharedPreferenceMatrix(page, assertHomepageSurface)
  assert.equal(await page.locator('.toolbox-nav-hamburger').count(), 0)
  const menuButton = page.locator('.toolbox-nav-menu-btn')
  await menuButton.click()
  const toolMenu = page.locator('.toolbox-nav-dropdown-menu')
  await toolMenu.waitFor({ state: 'visible' })
  assert.equal(await menuButton.getAttribute('aria-expanded'), 'true')
  await page.keyboard.press('Escape')
  await page.mouse.move(389, 843)
  await toolMenu.waitFor({ state: 'hidden' })
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  )
  assert.equal(
    await page.locator('.toolbox-footer').evaluate((element) => getComputedStyle(element).flexDirection),
    'column',
  )

  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] Homepage production shell passed')
} finally {
  await browser?.close()
  await stopPreview()
}
