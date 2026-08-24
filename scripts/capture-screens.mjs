#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { chromium } from 'playwright'
import { assembleStaticSite } from './assemble-static-site.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const outputDir = resolve(process.argv[2] ?? 'docs/screenshots')

const FIXED_TIME = new Date('2026-01-15T10:30:00Z')
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}
const MODES = ['dark', 'light']
const LANGS = ['zh', 'en']

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
}

const PAGES = [
  { app: 'homepage', path: '/' },
  { app: 'rate-lens', path: '/rate-lens/' },
  { app: 'chrono-sphere', path: '/chrono-sphere/' },
  { app: 'monitor-choice', path: '/monitor-choice/' },
  { app: 'sane-units', path: '/sane-units/' },
  { app: 'sane-units-storage', path: '/sane-units/storage' },
  { app: 'image-converter', path: '/image-converter/' },
  { app: 'crypto-lab', path: '/crypto-lab/' },
]

function serveStatic(directory, port) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    let pathname = decodeURIComponent(url.pathname)
    if (pathname.endsWith('/')) pathname += 'index.html'
    const target = join(directory, pathname)
    if (!target.startsWith(directory)) {
      res.writeHead(403)
      return res.end()
    }
    const candidates = [target, join(directory, '404.html')]
    for (const candidate of candidates) {
      try {
        const file = readFileSync(candidate)
        res.writeHead(candidate.endsWith('404.html') ? 404 : 200, {
          'content-type': MIME[extname(candidate)] ?? 'application/octet-stream',
        })
        return res.end(file)
      } catch {
        // try the next candidate
      }
    }
    res.writeHead(404)
    res.end('not found')
  })
  return new Promise((resolvePromise) => {
    server.listen(port, '127.0.0.1', () => resolvePromise(server))
  })
}

async function main() {
  const staging = resolve(root, 'node_modules', '.tmp-screens-site')
  assembleStaticSite(staging)
  mkdirSync(outputDir, { recursive: true })

  const port = 19871
  const server = await serveStatic(staging, port)
  const browser = await chromium.launch({ headless: true })

  let captured = 0
  try {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        locale: 'en-US',
      })
      await context.clock.setFixedTime(FIXED_TIME)
      // Block all cross-origin traffic: pages must render their offline or
      // manual fallback, which is deterministic by contract.
      await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort())

      for (const mode of MODES) {
        for (const lang of LANGS) {
          const page = await context.newPage()
          await page.addInitScript(([themeMode, uiLang]) => {
            localStorage.setItem('toolbox-theme', themeMode)
            localStorage.setItem('toolbox-lang', uiLang)
          }, [mode, lang])
          await page.emulateMedia({ reducedMotion: 'reduce' })

          for (const entry of PAGES) {
            const url = `http://127.0.0.1:${port}${entry.path}`
            await page.goto(url, { waitUntil: 'networkidle' })
            await page.evaluate(() => document.fonts.ready)
            await page.waitForTimeout(450)
            const name = `${entry.app}-${mode}-${lang}-${viewportName}.png`
            await page.screenshot({ path: join(outputDir, name) })
            captured += 1
          }
          await page.close()
        }
      }
      await context.close()
    }
  } finally {
    await browser.close()
    await new Promise((resolvePromise) => server.close(resolvePromise))
  }

  writeFileSync(
    join(outputDir, 'INDEX.md'),
    `# Screenshot baseline

Captured by \`pnpm shots\` (scripts/capture-screens.mjs) from the assembled
production site with a fixed clock (${FIXED_TIME.toISOString()}), blocked
cross-origin traffic, reduced motion, and seeded theme/language storage.

Regenerate after intentional visual changes and review the diff before
committing. Pixel diff thresholds are intentionally not enforced yet.

Matrix: ${PAGES.length} pages × ${MODES.length} modes × ${LANGS.length} languages × ${Object.keys(VIEWPORTS).length} viewports.
`,
  )
  console.log(`[screens] captured ${captured} screenshots into ${outputDir}`)
}

main()
