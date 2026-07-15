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
    assert.equal(await desktop.locator('button[role="tab"]').count(), 8)
    assert.equal(await desktop.locator('textarea').count(), 2)
    assert.ok(await desktop.getByText('CryptoLab').count() >= 1)
    assert.equal(
      await desktop.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    )
    assert.deepEqual(await desktop.locator('.cl-tabs').evaluate((tabs) => ({
      overflowY: getComputedStyle(tabs).overflowY,
      scrollbarWidth: getComputedStyle(tabs).scrollbarWidth,
      verticalOverflow: tabs.scrollHeight > tabs.clientHeight,
    })), { overflowY: 'hidden', scrollbarWidth: 'none', verticalOverflow: false })
  }
  await assertSharedPreferenceMatrix(desktop, assertDesktopSurface)

  await desktop.getByRole('tab', { name: '安全分享' }).click()
  await desktop.getByRole('button', { name: '生成收件人密钥' }).click()
  await desktop.waitForFunction(() => {
    const input = document.querySelector('#share-public-key')
    return input instanceof HTMLTextAreaElement && input.value.includes('BEGIN PUBLIC KEY')
  })
  await desktop.getByText('公钥 SHA-256 指纹').waitFor()
  assert.match(await desktop.locator('.cl-fingerprint code').textContent(), /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/)
  const secretMessage = '仅供浏览器回归验证的本地消息'
  await desktop.locator('#share-message').fill(secretMessage)
  await desktop.getByRole('button', { name: '加密并生成二维码' }).click()
  let qrImage = desktop.getByRole('img', { name: '包含 CL1 加密数据包的二维码' })
  await qrImage.waitFor()
  await desktop.locator('#share-message').fill(`${secretMessage}（修改）`)
  assert.equal(await qrImage.count(), 0)
  assert.equal(await desktop.locator('#share-packet-output').count(), 0)
  await desktop.locator('#share-message').fill(secretMessage)
  await desktop.getByRole('button', { name: '加密并生成二维码' }).click()
  qrImage = desktop.getByRole('img', { name: '包含 CL1 加密数据包的二维码' })
  await qrImage.waitFor()
  const qrSource = await qrImage.getAttribute('src')
  assert.ok(qrSource?.startsWith('data:image/png;base64,'))
  const packet = await desktop.locator('#share-packet-output').inputValue()
  assert.ok(packet.startsWith('CL1.'))
  assert.equal(packet.includes(secretMessage), false)
  await desktop.locator('input[type="file"]').setInputFiles({
    name: 'secure-message.png',
    mimeType: 'image/png',
    buffer: Buffer.from(qrSource.split(',')[1], 'base64'),
  })
  await desktop.getByText('已从文件读取并验证 CL1 数据包结构。').waitFor()
  await desktop.getByRole('button', { name: '使用私钥解密' }).click()
  await desktop.waitForFunction((expected) => {
    const output = document.querySelector('#share-decrypted-output')
    return output instanceof HTMLTextAreaElement && output.value === expected
  }, secretMessage)
  await desktop.getByRole('tab', { name: '关于' }).click()
  await desktop.getByRole('heading', { name: '关于 CryptoLab' }).waitFor()
  await desktop.getByRole('tab', { name: '安全分享' }).click()
  assert.equal(await desktop.locator('#share-decrypted-output').inputValue(), secretMessage)
  await desktop.getByRole('button', { name: '清除全部敏感数据' }).click()
  assert.equal(await desktop.locator('#share-public-key').inputValue(), '')
  assert.equal(await desktop.locator('#share-private-key').inputValue(), '')
  assert.equal(await desktop.locator('#share-message').inputValue(), '')
  assert.equal(await desktop.locator('#share-packet-input').inputValue(), '')
  assert.equal(await desktop.locator('#share-decrypted-output').count(), 0)

  await desktop.getByRole('tab', { name: 'RSA' }).click()
  await desktop.getByRole('button', { name: '密钥用途' }).click()
  await desktop.getByRole('button', { name: 'PSS 签名 / 验证' }).click()
  await desktop.getByRole('button', { name: '生成 PSS 密钥对' }).click()
  await desktop.waitForFunction(() => {
    const input = document.querySelector('#rsa-private-key')
    return input instanceof HTMLTextAreaElement && input.value.includes('BEGIN PRIVATE KEY')
  })
  await desktop.locator('#rsa-message').fill('浏览器本地签名回归')
  await desktop.getByRole('button', { name: '签名' }).click()
  await desktop.waitForFunction(() => {
    const input = document.querySelector('#rsa-signature')
    return input instanceof HTMLTextAreaElement && input.value.length > 100
  })
  await desktop.getByRole('button', { name: '验证' }).click()
  await desktop.locator('#rsa-output').waitFor()
  assert.equal(await desktop.locator('#rsa-output').inputValue(), '签名有效')
  await desktop.getByRole('tab', { name: '关于' }).click()
  await desktop.getByRole('heading', { name: '关于 CryptoLab' }).waitFor()

  const mobile = await browser.newPage({
    locale: 'zh-CN',
    viewport: { width: 390, height: 844 },
  })
  watchRuntime(mobile, runtimeFailures)
  await mobile.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertMobileSharedShell(mobile)
  const assertMobileSurface = async () => {
    assert.equal(await mobile.locator('button[role="tab"]').count(), 8)
    assert.equal(await mobile.locator('textarea').count(), 2)
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    )
    assert.deepEqual(await mobile.locator('.cl-tabs').evaluate((tabs) => ({
      overflowY: getComputedStyle(tabs).overflowY,
      scrollbarWidth: getComputedStyle(tabs).scrollbarWidth,
      verticalOverflow: tabs.scrollHeight > tabs.clientHeight,
    })), { overflowY: 'hidden', scrollbarWidth: 'none', verticalOverflow: false })
  }
  await assertSharedPreferenceMatrix(mobile, assertMobileSurface)

  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] CryptoLab shared shell and surface checks passed')
} finally {
  await browser?.close()
  await stopPreview()
}
