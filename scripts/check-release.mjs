import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TOOLBOX_RELEASE } from '../packages/app-manifest/manifest.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const failures = []

const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  failures.push(`package.json version "${version}" is not X.Y.Z`)
}

if (TOOLBOX_RELEASE !== `v${version}`) {
  failures.push(
    `TOOLBOX_RELEASE ${TOOLBOX_RELEASE} must match package.json version v${version}`,
  )
}

const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8')
const section = changelog.match(/^## (v\d+\.\d+\.\d+)\b/m)
if (!section) {
  failures.push('CHANGELOG has no released vX.Y.Z section')
} else if (section[1] !== `v${version}`) {
  failures.push(
    `CHANGELOG latest release ${section[1]} must match package.json version v${version}`,
  )
}

const releaseTag = process.env.RELEASE_TAG
if (releaseTag && releaseTag !== `v${version}`) {
  failures.push(`RELEASE_TAG ${releaseTag} must match package.json version v${version}`)
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[release] ${failure}`)
  }
  process.exit(1)
}

console.log(
  `[release] package.json, manifest and CHANGELOG agree on ${TOOLBOX_RELEASE}` +
    (releaseTag ? `; tag ${releaseTag} verified` : ''),
)
