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

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
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
