import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import {
  displayName,
  insertManifestEntry,
  manifestEntry,
  validateId,
} from './new-app.lib.mjs'

const script = resolve(new URL('.', import.meta.url).pathname, 'new-app.mjs')
const repoRoot = resolve(new URL('../', import.meta.url).pathname)

test('validateId accepts kebab-case tool ids only', () => {
  for (const id of ['a', 'rate-lens', 'chrono-sphere-2', 'abc123']) {
    assert.equal(validateId(id), null)
  }
  for (const id of ['', 'A', '1tool', 'a_b', '-a', 'a-', 'tool--id', '工具']) {
    assert.ok(validateId(id), `${id} should be rejected`)
  }
  assert.match(validateId('homepage'), /reserved/)
})

test('displayName falls back to a readable product name', () => {
  assert.equal(displayName('rate-lens'), 'Rate Lens')
  assert.equal(displayName('rate-lens', 'RateLens'), 'RateLens')
})

test('insertManifestEntry appends before the registry terminator', () => {
  const source = readFileSync(
    join(repoRoot, 'packages', 'app-manifest', 'manifest.js'),
    'utf8',
  )
  const next = insertManifestEntry(source, manifestEntry('draft-tool', 'Draft Tool'))
  const registryStart = next.indexOf('TOOLBOX_APPS')
  const registryEnd = next.indexOf('\n])', registryStart)
  assert.ok(registryStart >= 0)
  assert.ok(registryEnd > registryStart)
  const insertedAt = next.indexOf("id: 'draft-tool'")
  assert.ok(insertedAt > registryStart && insertedAt < registryEnd)
  assert.ok(next.includes('export function getStableApps'))
})

test('generator dry run writes nothing and a real run scaffolds a valid app', async () => {
  const root = mkdtempSync(join(tmpdir(), 'toolbox-new-app-'))
  mkdirSync(join(root, 'apps'))
  mkdirSync(join(root, 'packages', 'app-manifest'), { recursive: true })
  cpSync(
    join(repoRoot, 'packages', 'app-manifest'),
    join(root, 'packages', 'app-manifest'),
    { recursive: true },
  )

  const run = (args) =>
    execFileSync(process.execPath, [script, ...args], {
      cwd: repoRoot,
      env: { ...process.env, NO_COLOR: '1' },
    })

  run(['demo-tool', '--variant', 'react', '--name', 'Demo Tool', '--dry-run', '--root', root])
  assert.equal(existsSync(join(root, 'apps', 'demo-tool')), false)

  const firstOutput = run(['demo-tool', '--variant', 'react', '--name', 'Demo Tool', '--root', root]).toString()
  assert.match(firstOutput, /scaffolded apps\/demo-tool/)

  for (const relative of [
    'package.json',
    'index.html',
    'vite.config.mjs',
    'tsconfig.json',
    'src/main.tsx',
    'src/App.tsx',
    'src/styles.css',
    'tests/app.test.mjs',
    'tests/browser-smoke.mjs',
    'README.md',
    'README.zh-CN.md',
    'LICENSE',
  ]) {
    assert.equal(existsSync(join(root, 'apps', 'demo-tool', relative)), true, relative)
  }

  const manifestCopy = join(root, 'packages', 'app-manifest', 'manifest.js')
  const manifest = await import(pathToFileURL(manifestCopy).href)
  const entry = manifest.getAppById('demo-tool')
  assert.ok(entry)
  assert.equal(entry.status, 'hidden')
  assert.equal(entry.name, 'Demo Tool')

  const pkg = JSON.parse(readFileSync(join(root, 'apps', 'demo-tool', 'package.json'), 'utf8'))
  assert.equal(pkg.name, '@toolbox/demo-tool')

  assert.throws(
    () => run(['demo-tool', '--root', root]),
    /already exists|already contains/,
  )
})
