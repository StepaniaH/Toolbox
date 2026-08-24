import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const tag = process.argv[2]

if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error(`[release-notes] usage: node scripts/extract-release-notes.mjs vX.Y.Z`)
  process.exit(1)
}

const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8')
const heading = new RegExp(`^## ${tag}(?: .*)?$`, 'm').exec(changelog)
if (!heading) {
  console.error(`[release-notes] CHANGELOG has no section for ${tag}`)
  process.exit(1)
}

const start = heading.index
const next = changelog.indexOf('\n## ', start + 1)
const body = changelog
  .slice(changelog.indexOf('\n', start) + 1, next < 0 ? changelog.length : next)
  .trim()

if (body.length === 0) {
  console.error(`[release-notes] CHANGELOG section for ${tag} is empty`)
  process.exit(1)
}

process.stdout.write(`${body}\n`)
