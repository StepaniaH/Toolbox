import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { assertAppMarkStyle, assertDesktopSharedShell, assertMobileSharedShell, assertSharedPreferenceMatrix } from '@toolbox/nav/browser-contract.mjs'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const externalPreviewUrl = process.env.IMAGE_CONVERTER_PREVIEW_URL
const previewUrl = externalPreviewUrl ?? 'http://127.0.0.1:19888/image-converter/'
const preview = externalPreviewUrl ? null : spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', '19888', '--strictPort'], {
  cwd: appRoot, env: { ...process.env, NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
})
let previewOutput = ''
preview?.stdout.on('data', (chunk) => { previewOutput += chunk })
preview?.stderr.on('data', (chunk) => { previewOutput += chunk })

async function waitForPreview() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (preview?.exitCode !== null && preview?.exitCode !== undefined) throw new Error(`preview exited early\n${previewOutput}`)
    try { if ((await fetch(previewUrl)).ok) return } catch { /* not ready */ }
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
  const failures = []
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') failures.push(`console ${message.type()}: ${message.text()}`) })
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => failures.push(`request failed: ${request.url()}`))
  page.on('response', (response) => { if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico') failures.push(`response ${response.status()}: ${response.url()}`) })

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertDesktopSharedShell(page)
  await assertAppMarkStyle(page)
  await assertSharedPreferenceMatrix(page, async () => {
    assert.equal(await page.locator('.drop-zone').isVisible(), true)
    assert.equal(await page.locator('.control-grid').isVisible(), true)
    assert.equal(await page.locator('.toolbox-nav').count(), 1)
    assert.equal(await page.locator('.toolbox-footer').count(), 1)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  })

  const workspaceTab = page.getByRole('tab', { name: /Conversion workspace|转换工作台/ })
  const knowledgeTab = page.getByRole('tab', { name: /Knowledge base|知识库/ })
  assert.equal(await workspaceTab.getAttribute('aria-selected'), 'true')
  await knowledgeTab.click()
  assert.equal(await knowledgeTab.getAttribute('aria-selected'), 'true')
  assert.equal(await page.locator('.format-cards article').count(), 7)
  assert.equal(await page.locator('.comparison table').isVisible(), true)
  await knowledgeTab.press('ArrowLeft')
  assert.equal(await workspaceTab.getAttribute('aria-selected'), 'true')

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAD0lEQVR42mNkYPj/n4GBgQEABgAB/oc6WQAAAABJRU5ErkJggg==', 'base64')
  // The pure selection suite covers relative folder paths; here a mixed multi-file
  // selection exercises the same rejection UI without creating fixture files.
  await page.locator('input[type=file]').first().setInputFiles([
    { name: 'IMG_sample.png', mimeType: 'image/png', buffer: png },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') },
  ])
  assert.equal(await page.locator('.file-row').count(), 1)
  const rejectedSummary = page.locator('.rejection-summary')
  assert.equal(await rejectedSummary.isVisible(), true)
  await rejectedSummary.focus()
  assert.match(await page.locator('.rejection-popover').textContent(), /notes\.txt/)
  assert.match(await page.locator('.rejection-popover').textContent(), /Unsupported|不支持/)
  assert.match(await page.locator('.rename-preview code').textContent(), /IMG_sample\.webp/)
  await page.getByRole('button', { name: /Padded sequence|补零序号/ }).click()
  assert.match(await page.locator('.rename-panel input').first().inputValue(), /\{index\}/)
  await page.getByRole('button', { name: /Regex replace|正则替换/ }).click()
  await page.getByRole('button', { name: /Clean camera names|整理相机命名/ }).click()
  assert.match(await page.locator('.preview-heading').textContent(), /1 \/ 1/)
  await page.getByRole('button', { name: /Convert images|开始转换/ }).click()
  await page.locator('.status-badge.done').waitFor()
  assert.equal(await page.locator('.file-output strong').count(), 1)
  assert.equal(await page.locator('.file-row img').count() > 0, true)
  assert.equal(await page.locator('.result-gallery button').count(), 1)
  await page.locator('.result-gallery button').click()
  const dialog = page.getByRole('dialog')
  assert.equal(await dialog.isVisible(), true)
  assert.equal(await dialog.locator('.compare-grid figure').count(), 2)
  await page.keyboard.press('Escape')
  assert.equal(await dialog.count(), 0)
  assert.equal(await page.getByRole('button', { name: /Download ZIP|下载 ZIP/ }).isEnabled(), true)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertMobileSharedShell(page)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  assert.equal(await page.locator('.toolbox-nav-theme').count(), 1)
  assert.equal(await page.locator('.toolbox-nav-lang').count(), 1)
  assert.deepEqual(failures, [])
  console.log('[browser-smoke] Image Converter production build passed')
} finally {
  await browser?.close()
  await stopPreview()
}
