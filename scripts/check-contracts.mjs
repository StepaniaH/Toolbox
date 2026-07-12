import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  APP_STATUSES,
  TOOLBOX_APPS,
  TOOLBOX_RELEASE,
} from '../packages/app-manifest/manifest.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const failures = []

function read(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function fail(category, file, message) {
  failures.push(`${category}: ${file}${message ? ` (${message})` : ''}`)
}

const rootPackage = JSON.parse(read('package.json'))
if (TOOLBOX_RELEASE !== `v${rootPackage.version}`) {
  fail(
    'release-version-contract',
    'package.json',
    `manifest ${TOOLBOX_RELEASE} must match v${rootPackage.version}`,
  )
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

// ── GitHub Actions supply-chain and release contract ─────
const workflowFiles = trackedFiles('.github/workflows')
  .filter((file) => /\.ya?ml$/.test(file))

for (const file of workflowFiles) {
  const content = read(file)
  for (const match of content.matchAll(/^\s*(?:-\s*)?uses:\s*([^@\s#]+)@([^\s#]+)/gm)) {
    const action = match[1]
    const reference = match[2]
    if (action.startsWith('./') || /^[0-9a-f]{40}$/.test(reference)) continue
    fail(
      'github-action-pin-contract',
      file,
      `${action} must use an immutable 40-character commit SHA`,
    )
  }
}

const ciWorkflow = read('.github/workflows/ci.yml')
const deployJob = ciWorkflow.split(/\n  deploy:\s*\n/, 2)[1] ?? ''
for (const requirement of [
  "github.event_name == 'workflow_dispatch'",
  "github.ref == 'refs/heads/main'",
  'inputs.deploy_production == true',
  'environment: production',
]) {
  if (!deployJob.includes(requirement)) {
    fail('manual-production-deploy-contract', '.github/workflows/ci.yml', `missing ${requirement}`)
  }
}
if (deployJob.includes("github.event_name == 'push'")) {
  fail(
    'manual-production-deploy-contract',
    '.github/workflows/ci.yml',
    'a push to main must not deploy production automatically',
  )
}

// ── Nav interaction and deploy-copy contract ─────────────
const navCss = read('packages/nav/nav-bar.css')
const navReact = read('packages/nav/NavBar.tsx')
const navVanilla = read('packages/nav/nav-bar.js')
const navInner = ruleBody(navCss, '.toolbox-nav-inner')
const actionBase = ruleBody(navCss, '.toolbox-nav-icon-btn')
const actionHover = ruleBody(navCss, '.toolbox-nav-icon-btn:hover')
const actionFocus = ruleBody(navCss, '.toolbox-nav-icon-btn:focus-visible')

if (
  !navInner ||
  !/max-width\s*:\s*1280px/.test(navInner) ||
  !/margin\s*:\s*0\s+auto/.test(navInner)
) {
  fail(
    'nav-content-axis-contract',
    'packages/nav/nav-bar.css',
    'shared navigation must keep its centered 1280px content axis',
  )
}

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

for (const selector of [
  '.toolbox-nav-language-menu',
  '.toolbox-nav-language-option',
  '.toolbox-nav-theme-sun',
  '.toolbox-nav-theme-moon',
]) {
  if (!navCss.includes(selector)) {
    fail('nav-control-contract', 'packages/nav/nav-bar.css', `missing ${selector}`)
  }
}
for (const [file, content] of [
  ['packages/nav/NavBar.tsx', navReact],
  ['packages/nav/nav-bar.js', navVanilla],
]) {
  for (const requirement of [
    'toolbox-nav-language-menu',
    'menuitemradio',
    'data-lang',
    'toolbox-nav-theme-sun',
    'toolbox-nav-theme-moon',
  ]) {
    if (!content.includes(requirement)) {
      fail('nav-control-contract', file, `missing ${requirement}`)
    }
  }
  if (content.includes('toolbox-nav-hamburger') || content.includes('toolbox-nav-mobile')) {
    fail('nav-mobile-contract', file, 'duplicates the Toolbox tool switcher on mobile')
  }
  if (content.includes('🌓') || content.includes('is-animating')) {
    fail('nav-theme-contract', file, 'uses the legacy rotating emoji theme control')
  }
}

// ── App isolation, package and base-path contract ─────────
const appIds = readdirSync(resolve(root, 'apps'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort()
const appIdSet = new Set(appIds)
const manifestById = new Map(TOOLBOX_APPS.map((app) => [app.id, app]))
const legacyStaticApps = new Set()
const requiredPlatformPackages = ['@toolbox/i18n', '@toolbox/nav', '@toolbox/theme']

const allowedManifestFields = new Set([
  'id',
  'navId',
  'path',
  'name',
  'navLabel',
  'description',
  'icon',
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
  if (!app.icon?.viewBox || !app.icon?.svg) {
    fail('app-manifest-contract', 'packages/app-manifest/manifest.js', `${app.id} is missing its canonical icon`)
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

for (const [file, requirements] of [
  ['apps/homepage/js/main.js', ['app.icon', 'toolbox-footer.js']],
  ['apps/monitor-choice/entry.js', ['mountAppIcon', 'autoMountToolboxFooters']],
  ['apps/rate-lens/src/components/layout/Header.tsx', ['AppIcon', 'rate-lens']],
  ['apps/rate-lens/src/components/layout/Footer.tsx', ['ToolboxFooter', 'rate-lens']],
  ['apps/chrono-sphere/src/App.tsx', ['AppIcon', 'ToolboxFooter', 'chrono-sphere']],
  ['apps/sane-units/src/App.tsx', ['AppIcon', 'ToolboxFooter', 'sane-units']],
]) {
  const content = read(file)
  for (const requirement of requirements) {
    if (!content.includes(requirement)) {
      fail('shared-shell-identity-contract', file, `missing ${requirement}`)
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

// ── shared dependency catalog contract ───────────────────
const controlledToolchainDependencies = new Set([
  '@vitejs/plugin-react',
  'react',
  'react-dom',
  'typescript',
  'vite',
  'vitest',
])

function yamlEntry(line, indent) {
  const prefix = ' '.repeat(indent)
  if (!line.startsWith(prefix) || line.startsWith(`${prefix} `)) return null
  const match = /^(?:"([^"]+)"|'([^']+)'|([^:\s]+)):\s*(.*)$/.exec(line.slice(indent))
  if (!match) return null
  return { key: match[1] ?? match[2] ?? match[3], value: match[4] }
}

function parseWorkspaceCatalogs(content) {
  const catalogs = new Map()
  let section = null
  let activeCatalog = null

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '')
    if (line === 'catalog:') {
      section = 'default'
      activeCatalog = 'default'
      catalogs.set(activeCatalog, new Set())
      continue
    }
    if (line === 'catalogs:') {
      section = 'named'
      activeCatalog = null
      continue
    }
    if (line && !line.startsWith(' ')) {
      section = null
      activeCatalog = null
      continue
    }

    if (section === 'default') {
      const entry = yamlEntry(line, 2)
      if (entry?.value) catalogs.get('default').add(entry.key)
      continue
    }
    if (section !== 'named') continue

    const catalogEntry = yamlEntry(line, 2)
    if (catalogEntry && !catalogEntry.value) {
      activeCatalog = catalogEntry.key
      catalogs.set(activeCatalog, new Set())
      continue
    }
    const dependencyEntry = yamlEntry(line, 4)
    if (activeCatalog && dependencyEntry?.value) {
      catalogs.get(activeCatalog).add(dependencyEntry.key)
    }
  }

  return catalogs
}

const workspaceConfig = read('pnpm-workspace.yaml')
const dependencyCatalogs = parseWorkspaceCatalogs(workspaceConfig)
const packageFiles = [...appFiles, ...trackedFiles('packages')]
  .filter((file) => file.endsWith('/package.json'))

if (!workspaceConfig.includes('  vitest: "catalog:"')) {
  fail('dependency-catalog-contract', 'pnpm-workspace.yaml', 'Vitest override must use the default catalog')
}

for (const file of packageFiles) {
  const manifest = JSON.parse(read(file))
  const catalogReferences = new Map()

  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const [dependency, specifier] of Object.entries(manifest[field] ?? {})) {
      if (!controlledToolchainDependencies.has(dependency)) continue
      if (typeof specifier !== 'string' || !/^catalog:(?:[a-zA-Z0-9_-]+)?$/.test(specifier)) {
        fail(
          'dependency-catalog-contract',
          file,
          `${dependency} must reference pnpm-workspace.yaml through catalog:`,
        )
        continue
      }

      const catalogName = specifier === 'catalog:' ? 'default' : specifier.slice('catalog:'.length)
      const catalog = dependencyCatalogs.get(catalogName)
      if (!catalog?.has(dependency)) {
        fail(
          'dependency-catalog-contract',
          file,
          `${specifier} does not define ${dependency}`,
        )
      }
      if (catalogReferences.has(dependency) && catalogReferences.get(dependency) !== specifier) {
        fail('dependency-catalog-contract', file, `${dependency} uses multiple catalogs`)
      }
      catalogReferences.set(dependency, specifier)
    }
  }

  if (
    catalogReferences.has('react') &&
    catalogReferences.has('react-dom') &&
    catalogReferences.get('react') !== catalogReferences.get('react-dom')
  ) {
    fail('dependency-catalog-contract', file, 'react and react-dom must use the same catalog')
  }
  if (
    catalogReferences.has('vite') &&
    catalogReferences.has('@vitejs/plugin-react') &&
    catalogReferences.get('vite') !== catalogReferences.get('@vitejs/plugin-react')
  ) {
    fail('dependency-catalog-contract', file, 'Vite and its React plugin must use the same catalog')
  }
}

// ── localStorage namespace contract ──────────────────────
const globalStorageKeys = new Set(['toolbox-theme', 'toolbox-lang'])
const legacyStorageKeys = {
  'chrono-sphere': new Set(['chrono-sphere.theme']),
  'monitor-choice': new Set(['monitor-choice-prefs-v1']),
  'rate-lens': new Set(['ratelens-theme', 'ratelens-state']),
  'sane-units': new Set([
    'saneunits.theme',
    'saneunits.storage',
    'saneunits.network',
    'saneunits.power',
    'saneunits.video',
  ]),
}
const storageFiles = [...appFiles, ...trackedFiles('packages')]
  .filter((file) => ['.html', '.js', '.jsx', '.ts', '.tsx'].includes(extname(file)))
  .filter((file) => !file.includes('/__tests__/') && !file.endsWith('.test.mjs'))
const reportedStorageKeys = new Set()

function validateStorageKey(file, variable, key) {
  const appId = file.startsWith('apps/') ? file.split('/')[1] : null
  const isGlobal = globalStorageKeys.has(key)
  const isPrivate = appId && key.startsWith(`toolbox.${appId}.`)
  const isLegacy = Boolean(
    appId &&
    variable.startsWith('LEGACY_') &&
    legacyStorageKeys[appId]?.has(key),
  )
  if (isGlobal || isPrivate || isLegacy) return

  const reportKey = `${file}:${variable}:${key}`
  if (reportedStorageKeys.has(reportKey)) return
  reportedStorageKeys.add(reportKey)
  fail(
    'storage-key-contract',
    file,
    `${variable} must use toolbox-theme, toolbox-lang, or toolbox.${appId ?? '<app-id>'}.*`,
  )
}

for (const file of storageFiles) {
  const content = read(file)
  for (const match of content.matchAll(
    /\b([A-Z][A-Z0-9_]*KEY)\s*=\s*['"]([^'"]+)['"]/g,
  )) {
    validateStorageKey(file, match[1], match[2])
  }
  for (const match of content.matchAll(
    /\b((?:LEGACY_)?STATE_STORAGE_KEYS)\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/g,
  )) {
    for (const value of match[2].matchAll(/:\s*['"]([^'"]+)['"]/g)) {
      validateStorageKey(file, match[1], value[1])
    }
  }
  for (const match of content.matchAll(
    /(?:window\.|globalThis\.|global\.)?localStorage\.(?:getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]/g,
  )) {
    validateStorageKey(file, 'direct localStorage key', match[1])
  }
}

const sourceExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx'])
const importPattern = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(|@import\s*(?:url\(\s*)?)\s*['"]([^'"]+)['"]/g
const appPreferenceControlPattern = /\b(?:function|const)\s+(?:Theme|Language)Toggle\b/

for (const file of appFiles) {
  if (!sourceExtensions.has(extname(file))) continue
  const currentApp = file.split('/')[1]
  const content = read(file)

  if (
    ['.js', '.jsx', '.ts', '.tsx'].includes(extname(file)) &&
    !file.includes('/__tests__/') &&
    appPreferenceControlPattern.test(content)
  ) {
    fail(
      'global-preference-control-contract',
      file,
      'theme and language controls belong to the shared NavBar',
    )
  }

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
  console.log(`[contracts] Passed app isolation, base-path, network, NavBar and release contracts for ${appIds.length} apps.`)
}
