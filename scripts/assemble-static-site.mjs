import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStableApps, TOOLBOX_APPS, TOOLBOX_RELEASE } from '../packages/app-manifest/manifest.js'
import vm from 'node:vm'

const root = fileURLToPath(new URL('../', import.meta.url))
const modulePath = fileURLToPath(import.meta.url)
const MAX_PAGES_FILE_BYTES = 25 * 1024 * 1024
const MAX_PAGES_FILE_COUNT = 20_000
const PRIVATE_KEY_PATTERN = new RegExp([
  '-----BEGIN ',
  '(?:RSA |OPENSSH |EC )?',
  'PRIVATE KEY-----',
].join(''))

export const STATIC_ROUTE_FALLBACKS = Object.freeze({
  'sane-units': Object.freeze(['storage', 'network', 'video', 'power', 'about']),
})

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) {
      throw new Error(`Static output must not contain symbolic links: ${relative(directory, path)}`)
    }
    return entry.isDirectory() ? walkFiles(path) : [path]
  })
}

function copyDirectoryContents(source, destination) {
  mkdirSync(destination, { recursive: true })
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    cpSync(join(source, entry.name), join(destination, entry.name), {
      recursive: entry.isDirectory(),
      errorOnExist: true,
      force: false,
    })
  }
}


function renderFaviconSvg(icon) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + icon.viewBox + '">',
    '<rect x="-2" y="-2" width="52" height="52" rx="11" fill="#303446"/>',
    '<style>.app-icon-fill{fill:#c6d0f5;stroke:none}</style>',
    '<g fill="none" stroke="#c6d0f5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + icon.svg + '</g>',
    '</svg>',
  ].join('')
}

const FAVICON_LINK = '<link rel="icon" type="image/svg+xml" href="./favicon.svg">'

function applyFavicon(html, icon) {
  const stripped = html.replace(/\s*<link rel="icon"[^>]*>/g, '')
  return stripped.replace('</head>', '  ' + FAVICON_LINK + '\n</head>')
}

function renderNotFoundPage() {
  const runtime = readFileSync(resolve(root, 'packages', 'theme', 'toggle.js'), 'utf8')
  const context = { window: {} }
  vm.runInNewContext(runtime, context)
  const prePaint = context.window.ToolboxTheme.prePaintScript()
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — Toolbox</title>
<link rel="icon" type="image/svg+xml" href="./favicon.svg">
<script>${prePaint}</script>
<style>
:root { color-scheme: dark; }
:root[data-theme="light"] { color-scheme: light; }
* { box-sizing: border-box; margin: 0; }
body {
  min-height: 100vh; display: grid; place-items: center; padding: 24px;
  background: #303446; color: #c6d0f5;
  font-family: ui-rounded, "SF Pro Rounded", system-ui, "PingFang SC", "Noto Sans SC", sans-serif;
  -webkit-font-smoothing: antialiased;
}
:root[data-theme="light"] body { background: #eff1f5; color: #4c4f69; }
main { text-align: center; }
code {
  display: block; font-size: 72px; font-weight: 700; letter-spacing: 0.04em;
  color: #8caaee; font-family: "JetBrains Mono", "SF Mono", ui-monospace, monospace;
}
:root[data-theme="light"] code { color: #1e66f5; }
p { margin-top: 12px; font-size: 15px; opacity: 0.85; }
p[lang] { display: none; }
html[lang="zh-CN"] p[lang="zh-CN"] { display: block; }
html[lang="en"] p[lang="en"] { display: block; }
a {
  display: inline-block; margin-top: 28px; padding: 10px 22px;
  border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 600;
  background: #8caaee; color: #303446;
}
:root[data-theme="light"] a { background: #1e66f5; color: #ffffff; }
a:hover { filter: brightness(1.08); }
</style>
</head>
<body>
<main>
  <code>404</code>
  <p lang="zh-CN">页面不存在或已被移动。</p>
  <p lang="en">This page does not exist or has moved.</p>
  <a href="./">Toolbox</a>
</main>
<script>
(function () {
  try {
    var lang = localStorage.getItem('toolbox-lang') === 'en' ? 'en' : 'zh-CN';
    if (lang === 'en') lang = (navigator.language || 'en').indexOf('zh') === 0 ? 'zh-CN' : 'en';
    document.documentElement.lang = lang;
  } catch (e) {
    document.documentElement.lang = navigator.language && navigator.language.indexOf('zh') === 0 ? 'zh-CN' : 'en';
  }
})();
</script>
</body>
</html>
`
}


function renderOfflinePage() {
  const runtime = readFileSync(resolve(root, 'packages', 'theme', 'toggle.js'), 'utf8')
  const context = { window: {} }
  vm.runInNewContext(runtime, context)
  const prePaint = context.window.ToolboxTheme.prePaintScript()
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline — Toolbox</title>
<link rel="icon" type="image/svg+xml" href="./favicon.svg">
<script>${prePaint}</script>
<style>
:root { color-scheme: dark; }
:root[data-theme="light"] { color-scheme: light; }
* { box-sizing: border-box; margin: 0; }
body {
  min-height: 100vh; display: grid; place-items: center; padding: 24px;
  background: #303446; color: #c6d0f5;
  font-family: ui-rounded, "SF Pro Rounded", system-ui, "PingFang SC", "Noto Sans SC", sans-serif;
  -webkit-font-smoothing: antialiased;
}
:root[data-theme="light"] body { background: #eff1f5; color: #4c4f69; }
main { text-align: center; max-width: 420px; }
h1 { font-size: 22px; font-weight: 700; }
p[lang] { display: none; margin-top: 12px; font-size: 14px; opacity: 0.85; line-height: 1.6; }
html[lang="zh-CN"] p[lang="zh-CN"] { display: block; }
html[lang="en"] p[lang="en"] { display: block; }
button {
  margin-top: 24px; padding: 10px 22px; border: none; border-radius: 12px;
  font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
  background: #8caaee; color: #303446;
}
:root[data-theme="light"] button { background: #1e66f5; color: #ffffff; }
button:hover { filter: brightness(1.08); }
</style>
</head>
<body>
<main>
  <h1>Toolbox</h1>
  <p lang="zh-CN">当前处于离线状态。已缓存的页面仍可直接打开，其余功能将在恢复联网后可用。</p>
  <p lang="en">You are offline. Cached pages stay available; everything else resumes once you reconnect.</p>
  <button onclick="location.reload()">Retry / 重试</button>
</main>
<script>
(function () {
  try {
    var lang = localStorage.getItem('toolbox-lang') === 'en' ? 'en' : 'zh-CN';
    if (lang === 'en') lang = (navigator.language || 'en').indexOf('zh') === 0 ? 'zh-CN' : 'en';
    document.documentElement.lang = lang;
  } catch (e) {
    document.documentElement.lang = navigator.language && navigator.language.indexOf('zh') === 0 ? 'zh-CN' : 'en';
  }
})();
</script>
</body>
</html>
`
}

function renderServiceWorker(version) {
  const cacheName = `toolbox-${version}`
  return `// Toolbox service worker: hashed assets cache-first, navigations
// network-first with an offline fallback. Same-origin GET requests only.
const CACHE = '${cacheName}'
const PRECACHE = ['./offline.html', './404.html', './favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('./offline.html')),
        ),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
`
}

const SW_REGISTER = '<script>if ("serviceWorker" in navigator && location.protocol === "https:") { navigator.serviceWorker.register("/sw.js"); }</script>'

function injectServiceWorkerRegistration(html) {
  if (html.includes('serviceWorker.register')) return html
  return html.replace('</body>', '  ' + SW_REGISTER + '\n</body>')
}

function assertSafeOutputDirectory(outputDirectory) {
  const appsDirectory = resolve(root, 'apps')
  const protectedDirectories = [resolve(root), appsDirectory]
  if (
    outputDirectory === resolve('/') ||
    protectedDirectories.some((directory) => (
      outputDirectory === directory || directory.startsWith(`${outputDirectory}${sep}`)
    )) ||
    outputDirectory.startsWith(`${appsDirectory}${sep}`)
  ) {
    throw new Error('Refusing to replace a protected repository directory')
  }
}

export function auditStaticSite(outputDirectory) {
  const files = walkFiles(outputDirectory)
  if (files.length > MAX_PAGES_FILE_COUNT) {
    throw new Error(`Static output exceeds the Cloudflare Pages ${MAX_PAGES_FILE_COUNT}-file limit`)
  }

  let totalBytes = 0
  for (const file of files) {
    const relativePath = relative(outputDirectory, file)
    const pathParts = relativePath.split(sep)
    const size = statSync(file).size
    totalBytes += size

    if (size > MAX_PAGES_FILE_BYTES) {
      throw new Error(`Static asset exceeds the Cloudflare Pages 25 MiB limit: ${relativePath}`)
    }
    if (
      relativePath.endsWith('.map') ||
      pathParts.some((part) => ['.git', 'node_modules', 'deploy', 'functions'].includes(part)) ||
      pathParts.at(-1) === '_worker.js'
    ) {
      throw new Error(`Non-public or executable deployment content found: ${relativePath}`)
    }

    const bytes = readFileSync(file)
    if (!bytes.includes(0) && PRIVATE_KEY_PATTERN.test(bytes.toString('utf8'))) {
      throw new Error(`Private key material found in static output: ${relativePath}`)
    }
    if (!bytes.includes(0)) {
      const content = bytes.toString('utf8')
      if (
        /\b(?:CLOUDFLARE_API_TOKEN|GITHUB_TOKEN|VPS_(?:HOST|PORT|WWW)|TAILSCALE_OAUTH_CLIENT_(?:ID|SECRET)|RSYNC_RSH)\b/.test(content) ||
        /\/(?:Users|home)\/(?![<{[])[A-Za-z0-9._-]+\/[A-Za-z0-9._/-]+/.test(content) ||
        /\/srv\/www(?:\/|\b)/.test(content)
      ) {
        throw new Error(`Private deployment reference found in static output: ${relativePath}`)
      }
    }
  }

  return { fileCount: files.length, totalBytes }
}

export function assembleStaticSite(outputPath) {
  if (!outputPath) throw new Error('Usage: node scripts/assemble-static-site.mjs <output-directory>')

  const outputDirectory = resolve(outputPath)
  assertSafeOutputDirectory(outputDirectory)

  const apps = getStableApps()
  for (const app of apps) {
    const source = resolve(root, 'apps', app.id, 'dist')
    if (!existsSync(source) || !lstatSync(source).isDirectory()) {
      throw new Error(`Missing verified build output: apps/${app.id}/dist`)
    }
  }

  rmSync(outputDirectory, { recursive: true, force: true })
  mkdirSync(outputDirectory, { recursive: true })

  for (const app of apps) {
    const source = resolve(root, 'apps', app.id, 'dist')
    const destination = app.path === '/' ? outputDirectory : join(outputDirectory, app.id)
    copyDirectoryContents(source, destination)
    writeFileSync(join(destination, 'favicon.svg'), renderFaviconSvg(app.icon))
    const indexHtml = join(destination, 'index.html')
    writeFileSync(
      indexHtml,
      injectServiceWorkerRegistration(applyFavicon(readFileSync(indexHtml, 'utf8'), app.icon)),
    )

    for (const route of STATIC_ROUTE_FALLBACKS[app.id] ?? []) {
      const routeDirectory = join(destination, route)
      mkdirSync(routeDirectory, { recursive: true })
      // Deep routes serve the same assembled document as the app root so
      // favicons and service-worker registration behave identically.
      cpSync(indexHtml, join(routeDirectory, 'index.html'), {
        errorOnExist: true,
        force: false,
      })
    }
  }

  if (!existsSync(join(outputDirectory, 'index.html'))) {
    throw new Error('Static output is missing the homepage index.html')
  }

  writeFileSync(join(outputDirectory, '404.html'), renderNotFoundPage())
  writeFileSync(join(outputDirectory, 'offline.html'), renderOfflinePage())
  writeFileSync(join(outputDirectory, 'sw.js'), renderServiceWorker(TOOLBOX_RELEASE))

  return auditStaticSite(outputDirectory)
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const result = assembleStaticSite(process.argv[2])
    console.log(`[static-site] Assembled ${result.fileCount} public files (${result.totalBytes} bytes).`)
  } catch (error) {
    console.error(`[static-site] ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
