import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'

const trackedFiles = execFileSync('git', [
  'ls-files',
  '-z',
  '--cached',
  '--others',
  '--exclude-standard',
])
  .toString('utf8')
  .split('\0')
  .filter(Boolean)
  .filter((file) => existsSync(file))

const findings = new Map()

function report(category, file) {
  if (!findings.has(category)) findings.set(category, new Set())
  findings.get(category).add(file)
}

function hasCgnatAddress(content) {
  const candidates = content.matchAll(
    /(?:^|[^0-9])(100\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3}))(?:[^0-9]|$)/gm,
  )

  for (const candidate of candidates) {
    const second = Number(candidate[2])
    const third = Number(candidate[3])
    const fourth = Number(candidate[4])
    if (second >= 64 && second <= 127 && third <= 255 && fourth <= 255) {
      return true
    }
  }
  return false
}

const contentChecks = [
  ['private-key', /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/],
  ['aws-access-key', /AKIA[0-9A-Z]{16}/],
  ['github-token', /gh[pousr]_[A-Za-z0-9_]{20,}/],
  ['openai-token', /sk-[A-Za-z0-9_-]{20,}/],
  ['slack-token', /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ['google-api-key', /AIza[0-9A-Za-z_-]{35}/],
  ['bearer-token', /Authorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/-]{12,}/i],
  [
    'credential-assignment',
    /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\b\s*[:=]\s*["'](?!\{\{|<)[^"'\s]{8,}["']/i,
  ],
  ['personal-absolute-path', /\/(?:Users|home)\/(?![<{[])[^/\s]+/],
]

for (const file of trackedFiles) {
  const name = basename(file)
  if (name === '.env' || /\.(?:pem|p12|pfx|key)$/i.test(name)) {
    report('tracked-private-file', file)
  }

  const bytes = readFileSync(file)
  if (bytes.includes(0)) continue
  const content = bytes.toString('utf8')

  for (const [category, pattern] of contentChecks) {
    if (pattern.test(content)) report(category, file)
  }

  if (hasCgnatAddress(content)) report('cgnat-or-tailscale-address', file)

  if (file === 'deploy/.env.example') {
    for (const line of content.split(/\r?\n/)) {
      const match = /^(VPS_HOST|VPS_PORT|VPS_WWW)=(.+)$/.exec(line)
      if (match && !/^\{\{[A-Z0-9_]+\}\}$/.test(match[2])) {
        report('concrete-deploy-default', file)
      }
    }
  }
}

if (findings.size > 0) {
  console.error('[privacy] Potential private content found. Values are redacted:')
  for (const [category, files] of [...findings].sort(([a], [b]) => a.localeCompare(b))) {
    console.error(`[privacy] ${category}: ${[...files].sort().join(', ')}`)
  }
  process.exitCode = 1
} else {
  console.log(`[privacy] Checked ${trackedFiles.length} tracked or unignored files; no high-confidence private content found.`)
}
