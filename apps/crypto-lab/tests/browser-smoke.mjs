import assert from 'node:assert/strict'
import {
  assertAppMarkStyle,
  assertDesktopSharedShell,
  assertMobileSharedShell,
  assertSharedPreferenceMatrix,
} from '@toolbox/nav/browser-contract.mjs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const previewUrl = 'http://127.0.0.1:19881/crypto-lab/'
const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', '19881', '--strictPort'],
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
      // Server not ready yet.
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

function watchRuntime(page, failures) {
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      failures.push(`console ${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    failures.push(`request failed: ${request.url()}`)
  })
  page.on('response', (response) => {
    const url = response.url()
    const pathname = new URL(url).pathname
    if (response.status() >= 400 && pathname !== '/favicon.ico') {
      failures.push(`response ${response.status()}: ${pathname}`)
    }
  })
}

let browser
try {
  await waitForPreview()
  browser = await chromium.launch({ headless: true })
  const runtimeFailures = []

  const desktop = await browser.newPage({
    locale: 'zh-CN',
    viewport: { width: 1440, height: 1100 },
  })
  watchRuntime(desktop, runtimeFailures)
  await desktop.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertDesktopSharedShell(desktop)
  await assertAppMarkStyle(desktop)
  const assertDesktopSurface = async () => {
    assert.equal(await desktop.locator('button[role="tab"]').count(), 5)
    assert.equal(await desktop.locator('textarea').count(), 2)
    assert.ok(await desktop.getByText('CryptoLab').count() >= 1)
    assert.equal(
      await desktop.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    )
  }
  await assertSharedPreferenceMatrix(desktop, assertDesktopSurface)

  const mobile = await browser.newPage({
    locale: 'zh-CN',
    viewport: { width: 390, height: 844 },
  })
  watchRuntime(mobile, runtimeFailures)
  await mobile.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertMobileSharedShell(mobile)
  const assertMobileSurface = async () => {
    assert.equal(await mobile.locator('button[role="tab"]').count(), 5)
    assert.equal(await mobile.locator('textarea').count(), 2)
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    )
  }
  await assertSharedPreferenceMatrix(mobile, assertMobileSurface)

  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] CryptoLab shared shell and surface checks passed')
} finally {
  await browser?.close()
  await stopPreview()
}
