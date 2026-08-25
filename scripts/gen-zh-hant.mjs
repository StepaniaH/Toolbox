// Generates zh-Hant translation sources from the zh originals via OpenCC
// (cn -> tw). Build-time only; generated files are committed and reviewed.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const OpenCC = require('opencc-js')
const convert = OpenCC.Converter({ from: 'cn', to: 'tw' })
const root = fileURLToPath(new URL('../', import.meta.url))

function convertTree(node) {
  if (typeof node === 'string') return convert(node)
  if (Array.isArray(node)) return node.map(convertTree)
  const out = {}
  for (const [key, value] of Object.entries(node)) out[key] = convertTree(value)
  return out
}

function convertJsonApp(app) {
  const source = resolve(root, 'apps', app, 'src/translations/zh.json')
  const target = resolve(root, 'apps', app, 'src/translations/zh-Hant.json')
  writeFileSync(target, JSON.stringify(convertTree(JSON.parse(readFileSync(source, 'utf8'))), null, 2) + '\n')
  console.log('[gen] apps/%s/src/translations/zh-Hant.json', app)
}

/** Extract a balanced `{...}` block that starts at `start` (index of '{'). */
function balancedBlock(text, start) {
  let depth = 0
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1
    else if (text[i] === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  throw new Error('unbalanced braces')
}

function extractObject(source, anchor, contextNames = [], contextValues = []) {
  const at = source.indexOf(anchor)
  if (at === -1) throw new Error(`anchor not found: ${anchor}`)
  const brace = source.indexOf('{', at)
  const block = balancedBlock(source, brace)
  // The extracted literals are plain data; evaluation here is safe and
  // keeps the generator independent from a TypeScript parser. Spread
  // sources are supplied through the evaluation context.
  // eslint-disable-next-line no-new-func
  return new Function(...contextNames, `return (${block});`)(...contextValues)
}

function convertInlineTs(app, file, anchor, emit) {
  const sourcePath = resolve(root, 'apps', app, file)
  const converted = convertTree(extractObject(readFileSync(sourcePath, 'utf8'), anchor))
  emit(sourcePath, converted)
}

// ── JSON-file apps ──
for (const app of ['chrono-sphere', 'rate-lens', 'crypto-lab']) convertJsonApp(app)

// ── image-converter: inline translations object → generated JSON ──
{
  const sourcePath = resolve(root, 'apps/image-converter/src/i18n.ts')
  const source = readFileSync(sourcePath, 'utf8')
  const extra = extractObject(source, 'const extraKnowledgeZh', [], [])
  const extraEn = extractObject(source, 'const extraKnowledgeEn', [], [])
  const converted = convertTree(
    // Extract the zh subtree only; the imported zh-Hant map is the output
    // of this step and must not be evaluated.
    extractObject(source, 'zh: {', ['extraKnowledgeZh', 'extraKnowledgeEn'], [extra, extraEn]),
  )
  writeFileSync(
    resolve(root, 'apps/image-converter/src/i18n.zh-hant.generated.json'),
    JSON.stringify(converted, null, 2) + '\n',
  )
  console.log('[gen] image-converter i18n.zh-hant.generated.json')
}

// ── sane-units: TRANSLATIONS['zh-CN'] → generated JSON ──
{
  const sourcePath = resolve(root, 'apps/sane-units/src/lib/i18n.ts')
  const source = readFileSync(sourcePath, 'utf8')
  // Extract the zh-CN subtree only; the imported zh-Hant map is the output
  // of this step and must not be evaluated.
  const converted = convertTree(extractObject(source, '"zh-CN": {', [], []))
  writeFileSync(resolve(root, 'apps/sane-units/src/lib/translations.zh-hant.generated.json'), JSON.stringify(converted, null, 2) + '\n')
  console.log('[gen] sane-units translations.zh-hant.generated.json')
}

// ── settings: `const zh = {...}` → generated JSON ──
convertInlineTs('settings', 'src/translations.ts', 'const zh =', (path, converted) => {
  writeFileSync(resolve(root, 'apps/settings/src/translations.zh-hant.generated.json'), JSON.stringify(converted, null, 2) + '\n')
  console.log('[gen] settings translations.zh-hant.generated.json')
})

// ── homepage: inline i18n dict zh block → generated JSON ──
{
  const sourcePath = resolve(root, 'apps/homepage/js/i18n.js')
  const source = readFileSync(sourcePath, 'utf8')
  // Extract the zh subtree only; the imported zh-Hant map is the output
  // of this step and must not be evaluated.
  const converted = convertTree(extractObject(source, 'zh: {', [], []))
  writeFileSync(resolve(root, 'apps/homepage/js/zh-hant.generated.json'), JSON.stringify(converted, null, 2) + '\n')
  console.log('[gen] homepage zh-hant.generated.json')
}

// ── monitor-choice: flat assignment map → generated sibling script ──
{
  const source = readFileSync(resolve(root, 'apps/monitor-choice/js/i18n-zh.js'), 'utf8')
  const pairs = [...source.matchAll(/zh\['([^']+)'\]\s*=\s*'((?:[^'\\]|\\.)*)';/g)]
  if (pairs.length === 0) throw new Error('no zh assignments found')
  const lines = pairs.map(([, key, value]) => `  zhHant['${key}'] = '${convert(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}';`)
  const header = `/**
 * i18n-zh-hant.js — Traditional Chinese translation map.
 * Generated from i18n-zh.js by scripts/gen-zh-hant.mjs (OpenCC cn->tw).
 * Edit the simplified source, then regenerate; do not hand-edit here.
 */
(function () {
  'use strict';
  var zhHant = window.I18n.translations.zhHant;

`
  const footer = '\n})();\n'
  writeFileSync(resolve(root, 'apps/monitor-choice/js/i18n-zh-hant.js'), header + lines.join('\n') + footer)
  console.log('[gen] monitor-choice i18n-zh-hant.js (%d keys)', pairs.length)
}

// ── app-manifest: add zhHant overrides next to every zh field ──
{
  const manifestPath = resolve(root, 'packages/app-manifest/manifest.js')
  let source = readFileSync(manifestPath, 'utf8')
  const count = (re) => [...source.matchAll(re)].length
  const before = count(/zhHant:/g)
  source = source.replace(/(navLabel: \{ zh: '([^']*)', en:)/g, (_, keep, zh) => `${keep} ${keep.includes('navLabel') ? convert(zh) : zh}` )
  // navLabel/description/keywords/presentation: convert zh string values
  source = source.replace(/(navLabel: \{ zh: )('(?:[^'\\]|\\.)*')(, en:)/g, (_, a, lit, b) => `${a}${lit}, zhHant: ${JSON.stringify(convert(JSON.parse(lit.replace(/'/g, '"'))))}${b}`)
  source = source.replace(/(description: \{ zh: )('(?:[^'\\]|\\.)*')(, en:)/g, (_, a, lit, b) => `${a}${lit}, zhHant: ${JSON.stringify(convert(JSON.parse(lit.replace(/'/g, '"'))))}${b}`)
  source = source.replace(/(subtitle: \{ zh: )('(?:[^'\\]|\\.)*')(, en:)/g, (_, a, lit, b) => `${a}${lit}, zhHant: ${JSON.stringify(convert(JSON.parse(lit.replace(/'/g, '"'))))}${b}`)
  source = source.replace(/(title: \{ zh: )('(?:[^'\\]|\\.)*')(, en:)/g, (_, a, lit, b) => `${a}${lit}, zhHant: ${JSON.stringify(convert(JSON.parse(lit.replace(/'/g, '"'))))}${b}`)
  source = source.replace(/(description: \{\n        zh: )('(?:[^'\\]|\\.)*')(,\n        en:)/g, (_, a, lit, b) => `${a}${lit},\n        zhHant: ${JSON.stringify(convert(JSON.parse(lit.replace(/'/g, '"'))))}${b}`)
  // keywords: zh arrays gain a zhHant array
  source = source.replace(/keywords: \{\n      zh: \[([^\]]*)\],\n      en: \[/g, (_, zhList) => {
    const items = [...zhList.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1])
    const convertedList = items.map((item) => `'${convert(item).replace(/'/g, "\\'")}'`).join(', ')
    return `keywords: {\n      zh: [${zhList}],\n      zhHant: [${convertedList}],\n      en: [`
  })
  writeFileSync(manifestPath, source)
  console.log('[gen] manifest zhHant fields added (%d new)', count(/zhHant:/g) - before)
}
console.log('[gen] done')
