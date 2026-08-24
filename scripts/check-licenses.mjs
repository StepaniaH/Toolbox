import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

const ALLOWED_LICENSES = new Set([
  'MIT',
  'MIT-0',
  'ISC',
  '0BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-Source-Code',
  'Apache-2.0',
  'Unlicense',
  'CC0-1.0',
  'CC-BY-4.0',
  'BlueOak-1000.0.0',
  'BlueOak-1.0.0',
  'MPL-2.0',
  'Python-2.0',
  'OFL-1.1',
  'OFL-1.0',
  'WTFPL',
  'Zlib',
  'Artistic-2.0',
])

function* packageJsonFiles(directory) {
  if (!existsSync(directory)) return
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '.pnpm') {
        for (const store of readdirSync(path, { withFileTypes: true })) {
          if (!store.isDirectory()) continue
          const nested = join(path, store.name, 'node_modules')
          if (!existsSync(nested)) continue
          for (const pkg of readdirSync(nested, { withFileTypes: true })) {
            if (!pkg.isDirectory()) continue
            const manifest = join(nested, pkg.name, 'package.json')
            if (existsSync(manifest)) yield manifest
          }
        }
      } else if (entry.name !== '.bin' && entry.name !== '.modules.yaml') {
        const manifest = join(path, 'package.json')
        if (existsSync(manifest)) yield manifest
        else yield* packageJsonFiles(path)
      }
    }
  }
}

function licenseTokens(field) {
  const text = typeof field === 'string' ? field : field?.type ?? ''
  return text
    .replace(/\(|\)/g, ' ')
    .split(/\s+(?:OR|AND|WITH)\s+|\s+or\s+|\s+and\s+/i)
    .map((token) => token.trim())
    .filter(Boolean)
}

const seen = new Map()
const violations = []

for (const workspace of ['apps', 'packages']) {
  for (const entry of readdirSync(resolve(root, workspace), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifest = resolve(root, workspace, entry.name, 'package.json')
    if (existsSync(manifest)) {
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
      seen.set(pkg.name, pkg.license ?? 'UNLICENSED')
    }
  }
}

for (const manifestPath of packageJsonFiles(join(root, 'node_modules'))) {
  let pkg
  try {
    pkg = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    continue
  }
  if (!pkg.name || !pkg.version || seen.has(pkg.name)) continue
  seen.set(`${pkg.name}@${pkg.version}`, pkg.license ?? 'UNDEFINED')
  for (const token of licenseTokens(pkg.license)) {
    if (!ALLOWED_LICENSES.has(token)) {
      violations.push(`${pkg.name}@${pkg.version}: "${token}" (${pkg.license})`)
      break
    }
  }
}

if (violations.length > 0) {
  console.error(`[licenses] ${violations.length} package(s) with disallowed or unknown licenses:`)
  for (const violation of violations) console.error(`  ${violation}`)
  console.error('[licenses] extend the allowlist only after reviewing the license text.')
  process.exit(1)
}

console.log(`[licenses] ${seen.size} packages checked; all licenses are on the allowlist.`)
