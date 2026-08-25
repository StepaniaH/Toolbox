#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  displayName,
  insertManifestEntry,
  manifestEntry,
  reactFiles,
  validateId,
  vanillaFiles,
} from './new-app.lib.mjs'

const DEFAULT_ROOT = new URL('..', import.meta.url).pathname

function readManifest(path) {
  if (!existsSync(path)) {
    throw new Error('packages/app-manifest/manifest.js not found under the target root')
  }
  return readFileSync(path, 'utf8')
}

function usage() {
  console.error(
    'usage: node scripts/new-app.mjs <tool-id> [--variant vanilla|react] [--name "Display Name"] [--dry-run] [--root <dir>]',
  )
}

function parseArgs(argv) {
  const options = {
    id: null,
    variant: 'vanilla',
    name: null,
    dryRun: false,
    root: DEFAULT_ROOT,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--variant') {
      options.variant = argv[(i += 1)]
    } else if (arg === '--name') {
      options.name = argv[(i += 1)]
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--root') {
      options.root = resolve(argv[(i += 1)])
    } else if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    } else if (options.id === null) {
      options.id = arg
    } else {
      throw new Error(`unexpected argument "${arg}"`)
    }
  }
  return options
}

function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(`[new-app] ${error.message}`)
    usage()
    process.exit(1)
  }

  try {
    if (!options.id) throw new Error('missing <tool-id>')
    const idError = validateId(options.id)
    if (idError) throw new Error(`tool id "${options.id}" ${idError}`)
    if (options.variant !== 'vanilla' && options.variant !== 'react') {
      throw new Error(`unknown variant "${options.variant}", expected vanilla or react`)
    }
    const name = displayName(options.id, options.name)
    const appDir = join(options.root, 'apps', options.id)
    if (existsSync(appDir)) {
      throw new Error(`apps/${options.id} already exists`)
    }
    const manifestPath = join(options.root, 'packages', 'app-manifest', 'manifest.js')
    const manifestSource = readManifest(manifestPath)
    if (manifestSource.includes(`id: '${options.id}'`)) {
      throw new Error(`manifest already contains an entry for "${options.id}"`)
    }
    const nextManifest = insertManifestEntry(manifestSource, manifestEntry(options.id, name))
    const files =
      options.variant === 'react'
        ? reactFiles(options.id, name)
        : vanillaFiles(options.id, name)

    if (options.dryRun) {
      console.log(`[new-app] dry run for apps/${options.id} (${options.variant}):`)
      for (const file of files) console.log(`  would write apps/${options.id}/${file.path}`)
      console.log('  would register a hidden manifest entry')
      return
    }

    mkdirSync(appDir, { recursive: true })
    for (const file of files) {
      const target = join(appDir, file.path)
      mkdirSync(join(target, '..'), { recursive: true })
      writeFileSync(target, file.content)
    }
    writeFileSync(manifestPath, nextManifest)
    console.log(`[new-app] scaffolded apps/${options.id} (${options.variant})`)
    console.log('[new-app] registered hidden manifest entry — replace placeholder icon, copy and keywords before review')
    console.log('[new-app] run: pnpm install && pnpm --filter=@toolbox/' + options.id + ' test')
  } catch (error) {
    console.error(`[new-app] ${error.message}`)
    process.exit(1)
  }
}

main()
