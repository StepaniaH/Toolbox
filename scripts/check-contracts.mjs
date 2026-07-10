import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_STATUSES, TOOLBOX_APPS } from '../packages/app-manifest/manifest.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const failures = []

function read(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function fail(category, file, message) {
  failures.push(`${category}: ${file}${message ? ` (${message})` : ''}`)
}

function ruleBody(css, selector) {
  const start = css.indexOf(selector)
  if (start < 0) return null
  const open = css.indexOf('{', start + selector.length)
  const close = css.indexOf('}', open + 1)
  if (open < 0 || close < 0) return null
  return css.slice(open + 1, close)
}

function trackedFiles(path) {
  return execFileSync('git', [
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
    path,
  ])
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((file) => existsSync(resolve(root, file)))
}

// ── Nav interaction and deploy-copy contract ─────────────
const navCss = read('packages/nav/nav-bar.css')
const actionBase = ruleBody(navCss, '.toolbox-nav-icon-btn')
const actionHover = ruleBody(navCss, '.toolbox-nav-icon-btn:hover')
const actionFocus = ruleBody(navCss, '.toolbox-nav-icon-btn:focus-visible')

if (!actionBase || /outline\s*:\s*(?:none|0)\b/.test(actionBase)) {
  fail('nav-focus-contract', 'packages/nav/nav-bar.css', 'base action suppresses outlines')
}
if (!actionHover || /background(?:-color)?\s*:/.test(actionHover)) {
  fail('nav-hover-contract', 'packages/nav/nav-bar.css', 'hover draws a background box')
}
if (
  !actionFocus ||
  !/outline\s*:\s*2px\s+solid\s+var\(--ctp-blue\)/.test(actionFocus) ||
  /outline\s*:\s*(?:none|0)\b/.test(actionFocus)
) {
  fail('nav-focus-contract', 'packages/nav/nav-bar.css', 'focus-visible lacks the 2px blue outline')
}

// ── App isolation, package and base-path contract ─────────
const appIds = readdirSync(resolve(root, 'apps'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort()
const appIdSet = new Set(appIds)
const manifestById = new Map(TOOLBOX_APPS.map((app) => [app.id, app]))
const legacyStaticApps = new Set()
const legacyThemeMigration = new Set(['chrono-sphere', 'rate-lens', 'sane-units'])
const requiredPlatformPackages = ['@toolbox/i18n', '@toolbox/nav', '@toolbox/theme']

const allowedManifestFields = new Set([
  'id',
  'navId',
  'path',
  'name',
  'navLabel',
  'description',
  'status',
])
for (const app of TOOLBOX_APPS) {
  if (!appIdSet.has(app.id)) {
    fail('app-manifest-contract', 'packages/app-manifest/manifest.js', `unknown app ${app.id}`)
  }
  const expectedPath = app.id === 'homepage' ? '/' : `/${app.id}/`
  if (app.path !== expectedPath) {
    fail('app-manifest-contract', 'packages/app-manifest/manifest.js', `${app.id} must use ${expectedPath}`)
  }
  if (!APP_STATUSES.includes(app.status)) {
    fail('app-manifest-contract', 'packages/app-manifest/manifest.js', `${app.id} has invalid status`)
  }
  for (const field of Object.keys(app)) {
    if (!allowedManifestFields.has(field)) {
      fail('app-manifest-contract', 'packages/app-manifest/manifest.js', `${app.id} has non-public field ${field}`)
    }
  }
}

for (const appId of appIds) {
  if (!manifestById.has(appId)) {
    fail('app-manifest-contract', 'packages/app-manifest/manifest.js', `missing app ${appId}`)
  }
}

for (const consumer of [
  'apps/homepage/js/main.js',
  'packages/nav/NavBar.tsx',
  'packages/nav/nav-bar.js',
]) {
  const content = read(consumer)
  if (!content.includes('@toolbox/app-manifest')) {
    fail('app-manifest-consumer', consumer, 'must consume the canonical manifest')
  }
  for (const app of TOOLBOX_APPS) {
    if (app.path !== '/' && content.includes(app.path)) {
      fail('app-manifest-consumer', consumer, `duplicates route ${app.path}`)
    }
  }
}

for (const appId of appIds) {
  const packagePath = `apps/${appId}/package.json`
  let manifest
  try {
    manifest = JSON.parse(read(packagePath))
  } catch {
    if (!legacyStaticApps.has(appId)) {
      fail('app-package-contract', packagePath, 'new apps require a workspace package')
    }
    continue
  }

  if (manifest.name !== `@toolbox/${appId}`) {
    fail('app-package-contract', packagePath, 'package name must match the app directory')
  }
  for (const script of ['build', 'test', 'lint']) {
    if (typeof manifest.scripts?.[script] !== 'string') {
      fail('app-package-contract', packagePath, `missing ${script} script`)
    }
  }

  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
  for (const otherApp of appIds) {
    if (otherApp !== appId && dependencies[`@toolbox/${otherApp}`]) {
      fail('cross-app-dependency', packagePath, `depends on app ${otherApp}`)
    }
  }
  for (const platformPackage of requiredPlatformPackages) {
    if (!dependencies[platformPackage]) {
      if (platformPackage === '@toolbox/theme' && legacyThemeMigration.has(appId)) continue
      fail('platform-dependency', packagePath, `missing ${platformPackage}`)
    }
  }

  const viteConfig = readdirSync(resolve(root, `apps/${appId}`))
    .find((name) => /^vite\.config\.(?:js|mjs|ts)$/.test(name))
  if (!viteConfig) {
    fail('app-base-contract', `apps/${appId}`, 'missing Vite config')
  } else {
    const config = read(`apps/${appId}/${viteConfig}`)
    const expectedBase = manifestById.get(appId)?.path
    if (!expectedBase) continue
    if (!config.includes(`'${expectedBase}'`) && !config.includes(`"${expectedBase}"`)) {
      fail('app-base-contract', `apps/${appId}/${viteConfig}`, `missing ${expectedBase}`)
    }
    const outDir = /outDir\s*:\s*['"]([^'"]+)['"]/.exec(config)?.[1]
    if (outDir && outDir !== 'dist') {
      fail('app-output-contract', `apps/${appId}/${viteConfig}`, 'build output must remain dist')
    }
  }
}

const appFiles = trackedFiles('apps')
const forbiddenAppLocks = new Set(['package-lock.json', 'yarn.lock'])
for (const file of appFiles) {
  if (forbiddenAppLocks.has(basename(file))) {
    fail('dependency-lock-contract', file, 'the workspace uses only the root pnpm-lock.yaml')
  }
}
if (!existsSync(resolve(root, 'pnpm-lock.yaml'))) {
  fail('dependency-lock-contract', 'pnpm-lock.yaml', 'root lockfile is missing')
}

const sourceExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx'])
const importPattern = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(|@import\s*(?:url\(\s*)?)\s*['"]([^'"]+)['"]/g

for (const file of appFiles) {
  if (!sourceExtensions.has(extname(file))) continue
  const currentApp = file.split('/')[1]
  const content = read(file)

  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1]
    if (specifier.startsWith('.')) {
      const target = resolve(root, dirname(file), specifier)
      const appsRoot = `${resolve(root, 'apps')}${sep}`
      if (target.startsWith(appsRoot)) {
        const relativeTarget = target.slice(appsRoot.length)
        const targetApp = relativeTarget.split(sep)[0]
        if (targetApp && targetApp !== currentApp) {
          fail('cross-app-import', file, `imports app ${targetApp}`)
        }
      }
    }

    const toolboxPackage = /^@toolbox\/([^/]+)$/.exec(specifier)?.[1]
    if (toolboxPackage && appIdSet.has(toolboxPackage) && toolboxPackage !== currentApp) {
      fail('cross-app-import', file, `imports app package ${toolboxPackage}`)
    }
  }
}

// ── Runtime network allowlist ─────────────────────────────
const externalOrigins = JSON.parse(read('config/external-origins.json'))
const networkApiPattern = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/
const absoluteUrlPattern = /https?:\/\/[^\s'"`<>]+/g

for (const file of appFiles) {
  if (!sourceExtensions.has(extname(file)) || file.includes('/__tests__/')) continue
  const content = read(file)
  if (!networkApiPattern.test(content)) continue

  const absoluteUrls = [...content.matchAll(absoluteUrlPattern)].map((match) => match[0])
  const allowed = new Set(externalOrigins[file] ?? [])
  const hasRelativeFetch = /\bfetch\s*\(\s*['"](?:\/[^/]|\.\.?\/)/.test(content)

  if (allowed.size === 0 && !hasRelativeFetch) {
    fail('runtime-network-contract', file, 'external or dynamic network access is not allowlisted')
    continue
  }

  for (const value of absoluteUrls) {
    let origin
    try {
      origin = new URL(value).origin
    } catch {
      fail('runtime-network-contract', file, 'contains an invalid absolute URL')
      continue
    }
    if (!allowed.has(origin)) {
      fail('runtime-network-contract', file, 'contains an origin outside its allowlist')
    }
  }

  for (const origin of allowed) {
    if (!absoluteUrls.some((value) => {
      try {
        return new URL(value).origin === origin
      } catch {
        return false
      }
    })) {
      fail('runtime-network-contract', file, 'contains a stale allowlist origin')
    }
  }
}

for (const file of Object.keys(externalOrigins)) {
  if (!appFiles.includes(file)) {
    fail('runtime-network-contract', file, 'allowlist references a missing source file')
  }
}

if (failures.length > 0) {
  console.error('[contracts] Contract violations:')
  for (const failure of failures.sort()) console.error(`[contracts] ${failure}`)
  process.exitCode = 1
} else {
  console.log(`[contracts] Passed app isolation, base-path, network and NavBar contracts for ${appIds.length} apps.`)
}
