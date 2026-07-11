import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const previewUrl = 'http://127.0.0.1:19880/rate-lens/'
const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', '19880', '--strictPort'],
  {
    cwd: appRoot,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)
let previewOutput = ''
preview.stdout.on('data', (chunk) => { previewOutput += chunk })
preview.stderr.on('data', (chunk) => { previewOutput += chunk })

const isRateRequest = (url) =>
  url.startsWith('https://open.er-api.com/') ||
  url.startsWith('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@')

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

function watchRuntime(page, failures, rateRequests) {
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      failures.push(`console ${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  page.on('request', (request) => {
    if (isRateRequest(request.url())) rateRequests.push(request.url())
  })
  page.on('requestfailed', (request) => {
    failures.push(`request failed: ${request.url()}`)
  })
  page.on('response', (response) => {
    const url = response.url()
    const pathname = new URL(url).pathname
    if (response.status() >= 400 && pathname !== '/favicon.ico' && !isRateRequest(url)) {
      failures.push(`response ${response.status()}: ${pathname}`)
    }
  })
}

let browser
try {
  await waitForPreview()
  browser = await chromium.launch({ headless: true })
  const runtimeFailures = []

  const successRequests = []
  const desktop = await browser.newPage({
    locale: 'zh-CN',
    viewport: { width: 1440, height: 1100 },
  })
  watchRuntime(desktop, runtimeFailures, successRequests)
  await desktop.route('https://open.er-api.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ rates: { CNY: 7.1234 } }),
    }),
  )
  await desktop.route('https://cdn.jsdelivr.net/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ usd: { cny: 7.1234 } }),
    }),
  )
  await desktop.goto(previewUrl, { waitUntil: 'networkidle' })

  assert.equal(await desktop.locator('.toolbox-nav-theme').count(), 1)
  assert.equal(await desktop.locator('.toolbox-nav-lang').count(), 1)
  assert.equal(
    await desktop.getByText(/页面打开后会自动连接第三方公开汇率服务/).count(),
    1,
  )
  assert.equal(await desktop.getByText('7.1234', { exact: true }).count(), 1)
  assert.equal(await desktop.getByRole('spinbutton', { name: 'USD/CNY 汇率' }).count(), 0)
  assert.deepEqual(successRequests, ['https://open.er-api.com/v6/latest/USD'])

  const failureRequests = []
  const mobile = await browser.newPage({
    locale: 'zh-CN',
    viewport: { width: 390, height: 844 },
  })
  watchRuntime(mobile, runtimeFailures, failureRequests)
  await mobile.route('https://open.er-api.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    }),
  )
  await mobile.route('https://cdn.jsdelivr.net/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    }),
  )
  await mobile.goto(previewUrl, { waitUntil: 'networkidle' })

  assert.equal(failureRequests.length, 2)
  assert.ok(failureRequests[0].startsWith('https://open.er-api.com/'))
  assert.ok(failureRequests[1].startsWith('https://cdn.jsdelivr.net/'))
  assert.equal(
    await mobile.getByText(/自动获取实时汇率失败，请填写当前 USD\/CNY 汇率后继续/).count(),
    1,
  )
  const manualInput = mobile.getByRole('spinbutton', { name: 'USD/CNY 汇率' })
  assert.equal(await manualInput.count(), 1)
  await manualInput.fill('7.25')
  await mobile.getByRole('button', { name: '确认' }).click()
  assert.equal(await mobile.getByText('7.25', { exact: true }).count(), 1)
  assert.equal(await mobile.getByText(/¥\/USD · 手动/).count(), 1)
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  )

  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] RateLens live-rate production paths passed')
} finally {
  await browser?.close()
  await stopPreview()
}
