import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStableApps } from '../packages/app-manifest/manifest.js'

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

    for (const route of STATIC_ROUTE_FALLBACKS[app.id] ?? []) {
      const routeDirectory = join(destination, route)
      mkdirSync(routeDirectory, { recursive: true })
      cpSync(join(source, 'index.html'), join(routeDirectory, 'index.html'), {
        errorOnExist: true,
        force: false,
      })
    }
  }

  if (!existsSync(join(outputDirectory, 'index.html'))) {
    throw new Error('Static output is missing the homepage index.html')
  }

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
