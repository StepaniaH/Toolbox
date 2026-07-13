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
    assert.equal(await page.locator('.file-home-intake').isVisible(), true)
    assert.equal(await page.locator('.family-overview').isVisible(), true)
    assert.equal(await page.locator('.toolbox-nav').count(), 1)
    assert.equal(await page.locator('.toolbox-footer').count(), 1)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  })

  const homeTab = page.getByRole('tab', { name: /File home|文件首页/ })
  const workspaceTab = page.getByRole('tab', { name: /Image conversion|图片格式转换/ })
  const gifTab = page.getByRole('tab', { name: /GIF composer|GIF 合成/ })
  const textTab = page.getByRole('tab', { name: /Text & markup|文本与标记转换/ })
  const knowledgeTab = page.getByRole('tab', { name: /Knowledge base|知识库/ })
  assert.equal(await homeTab.getAttribute('aria-selected'), 'true')
  assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), 'FormTran')
  assert.match(await page.locator('.tab-privacy').textContent(), /File home privacy|文件首页隐私说明/)
  assert.equal(await page.locator('.gif-page').isVisible(), false)
  assert.equal(await page.locator('.text-page').isVisible(), false)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAD0lEQVR42mNkYPj/n4GBgQEABgAB/oc6WQAAAABJRU5ErkJggg==', 'base64')
  await page.locator('.file-home-intake input[type=file]').first().setInputFiles([
    { name: 'IMG_sample.png', mimeType: 'image/png', buffer: png },
    { name: 'manual.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n') },
  ])
  await page.waitForFunction(() => document.querySelectorAll('.home-file-list > div').length === 2 && !document.body.textContent.includes('Identifying locally'))
  assert.equal(await page.locator('.home-file-list > div').count(), 2)
  assert.match(await page.locator('.file-summary').textContent(), /PNG/)
  assert.equal(await page.locator('.capability.planned').count() > 0, true)
  await page.locator('.tool-row').first().getByRole('button', { name: /Open tool|打开工具/ }).click()
  assert.equal(await workspaceTab.getAttribute('aria-selected'), 'true')
  assert.equal(await page.locator('.file-row').count(), 1)
  assert.match(await page.locator('.tab-privacy').textContent(), /Image conversion privacy|图片格式转换隐私说明/)
  const uploadBox = await page.locator('.drop-zone').boundingBox()
  const queueBox = await page.locator('.queue-panel').boundingBox()
  assert.equal(Boolean(uploadBox && queueBox && Math.abs(uploadBox.y - queueBox.y) < 4 && Math.abs(uploadBox.width - queueBox.width) < 4 && Math.abs(uploadBox.height - queueBox.height) < 4), true)
  const settingBox = await page.locator('.settings-panel').boundingBox()
  const namingBox = await page.locator('.rename-panel').boundingBox()
  assert.equal(Boolean(settingBox && namingBox && Math.abs(settingBox.height - namingBox.height) < 4), true)
  await knowledgeTab.click()
  assert.equal(await knowledgeTab.getAttribute('aria-selected'), 'true')
  assert.equal(await page.locator('.format-list details').count(), 7)
  assert.equal(await page.locator('.comparison table').isVisible(), true)
  await page.getByRole('button', { name: /Animation & GIF|动画与 GIF/ }).click()
  assert.equal(await page.locator('.knowledge-topic article').count(), 4)
  assert.equal(await page.locator('.knowledge-comparison table').isVisible(), true)
  await page.getByRole('button', { name: /Text & markup|文本与标记/ }).click()
  assert.equal(await page.locator('.knowledge-topic article').count(), 6)
  assert.equal(await page.locator('.knowledge-comparison table').isVisible(), true)
  assert.match(await page.locator('.tab-privacy').textContent(), /Knowledge base privacy|知识库隐私说明/)
  await workspaceTab.click()
  assert.equal(await workspaceTab.getAttribute('aria-selected'), 'true')

  // The pure selection suite covers relative folder paths; here a mixed multi-file
  // selection exercises the same rejection UI without creating fixture files.
  await page.locator('.drop-zone input[type=file]').first().setInputFiles([
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') },
  ])
  assert.equal(await page.locator('.file-row').count(), 1)
  assert.match(await page.locator('.import-feedback').textContent(), /No files were added|本次没有文件加入/)
  const rejectedSummary = page.locator('.rejection-summary')
  assert.equal(await rejectedSummary.isVisible(), true)
  await rejectedSummary.focus()
  assert.match(await page.locator('.rejection-popover').textContent(), /notes\.txt/)
  assert.match(await page.locator('.rejection-popover').textContent(), /Unsupported|不支持/)
  assert.match(await page.locator('.rename-preview code').textContent(), /IMG_sample\.webp/)
  await page.getByRole('button', { name: /Padded sequence|补零序号/ }).click()
  assert.match(await page.locator('.rename-panel input').first().inputValue(), /\{index\}/)
  await page.getByRole('button', { name: /Advanced regex naming|高级正则命名/ }).click()
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
  const outputSelect = page.getByLabel(/Output as|输出方式/)
  assert.match(await outputSelect.textContent(), /Direct files|直接文件/)
  await page.evaluate(() => {
    window.__formtranDownloads = []
    HTMLAnchorElement.prototype.click = function captureDownload() { window.__formtranDownloads.push(this.download) }
  })
  await page.locator('.download-control').getByRole('button', { name: /^Download$|^下载$/ }).click()
  await page.waitForFunction(() => window.__formtranDownloads.length === 1)
  assert.match(await page.evaluate(() => window.__formtranDownloads[0]), /\.webp$/)
  await outputSelect.click()
  await page.getByRole('option', { name: /ZIP archive|ZIP 压缩包/ }).click()
  await page.locator('.download-control').getByRole('button', { name: /^Download$|^下载$/ }).click()
  await page.waitForFunction(() => window.__formtranDownloads.length === 2)
  assert.match(await page.evaluate(() => window.__formtranDownloads[1]), /\.zip$/)

  await textTab.click()
  assert.match(await page.locator('.tab-privacy').textContent(), /Text and markup privacy|文本与标记转换隐私说明/)
  await page.locator('.text-actions input[type=file]').setInputFiles([
    { name: 'guide.md', mimeType: 'text/markdown', buffer: Buffer.from('# Guide\n\nOne') },
    { name: 'notes.org', mimeType: 'text/plain', buffer: Buffer.from('* Notes\n\nTwo') },
  ])
  await page.waitForFunction(() => document.querySelectorAll('.text-file-list > div').length === 2)
  assert.equal(await page.locator('.text-file-list > div').count(), 2)
  assert.match(await page.locator('.text-file-panel').textContent(), /guide\.md/)
  await page.getByLabel(/Input|输入/).fill('# Heading\n\n- one\n- two')
  await page.getByLabel(/Batch output format|批量输出格式/).click()
  await page.getByRole('option', { name: 'Org mode' }).click()
  assert.match(await page.getByLabel(/Converted output|转换结果/).inputValue(), /^\* Heading/m)
  assert.equal(await page.locator('.structure-chips span').count() >= 2, true)

  await gifTab.click()
  assert.match(await page.locator('.tab-privacy').textContent(), /GIF composer privacy|GIF 合成隐私说明/)
  await page.locator('.gif-sources input[type=file]').setInputFiles([
    { name: 'frame-1.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="red"/></svg>') },
    { name: 'frame-2.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="blue"/></svg>') },
  ])
  assert.equal(await page.locator('.frame-strip article').count(), 2)
  await page.locator('.gif-settings input[type=number]').nth(0).fill('64')
  await page.locator('.gif-settings input[type=number]').nth(1).fill('64')
  await page.getByRole('button', { name: /Generate GIF|生成 GIF/ }).click()
  await delay(500)
  if (!await page.locator('.gif-result').count()) throw new Error(`GIF generation failed: ${await page.locator('.gif-settings').textContent()}`)
  await page.locator('.gif-result').waitFor()
  await page.waitForFunction(() => document.querySelector('.gif-result img')?.naturalWidth === 64)
  const bottomPixel = await page.locator('.gif-result img').evaluate(async (image) => {
    await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
    return [...context.getImageData(32, 63, 1, 1).data]
  })
  assert.equal(bottomPixel[3], 255)
  assert.equal(Math.max(...bottomPixel.slice(0, 3)) > 150 && Math.min(...bottomPixel.slice(0, 3)) < 80, true)
  assert.equal(await page.getByRole('button', { name: /Download GIF|下载 GIF/ }).isVisible(), true)
  await page.locator('.gif-page').getByRole('button', { name: /^Clear$|^清空$/ }).click()
  assert.equal(await page.locator('.frame-strip article').count(), 0)
  assert.equal(await page.locator('.gif-result').count(), 0)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertMobileSharedShell(page)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  assert.equal(await page.locator('.toolbox-nav-theme').count(), 1)
  assert.equal(await page.locator('.toolbox-nav-lang').count(), 1)
  assert.deepEqual(failures, [])
  console.log('[browser-smoke] FormTran production build passed')
} finally {
  await browser?.close()
  await stopPreview()
}
