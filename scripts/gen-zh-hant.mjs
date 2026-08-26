// Generates zh-Hant translation sources from the zh originals via OpenCC
// (cn -> tw). Build-time only; generated files are committed and reviewed.
//
// Exposes generateZhHant() returning a Map<absolutePath, content> so
// scripts/check-contracts.mjs can assert committed files are not drifting.
// Running this file directly writes every generated file in place.
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'

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

function convertJsonApp(outputs, app) {
  const source = readFileSync(resolve(root, 'apps', app, 'src/translations/zh.json'), 'utf8')
  outputs.set(
    resolve(root, 'apps', app, 'src/translations/zh-Hant.json'),
    JSON.stringify(convertTree(JSON.parse(source)), null, 2) + '\n',
  )
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

function convertInlineTs(outputs, app, file, anchor, emit) {
  const sourcePath = resolve(root, 'apps', app, file)
  const converted = convertTree(extractObject(readFileSync(sourcePath, 'utf8'), anchor))
  emit(sourcePath, converted, outputs)
}

export function generateZhHant() {
  const outputs = new Map()

  // ── JSON-file apps ──
  for (const app of ['chrono-sphere', 'rate-lens', 'crypto-lab']) convertJsonApp(outputs, app)

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
    outputs.set(
      resolve(root, 'apps/image-converter/src/i18n.zh-hant.generated.json'),
      JSON.stringify(converted, null, 2) + '\n',
    )
  }

  // ── sane-units: TRANSLATIONS['zh-CN'] → generated JSON ──
  {
    const sourcePath = resolve(root, 'apps/sane-units/src/lib/i18n.ts')
    const source = readFileSync(sourcePath, 'utf8')
    // Extract the zh-CN subtree only; the imported zh-Hant map is the output
    // of this step and must not be evaluated.
    const converted = convertTree(extractObject(source, '"zh-CN": {', [], []))
    outputs.set(
      resolve(root, 'apps/sane-units/src/lib/translations.zh-hant.generated.json'),
      JSON.stringify(converted, null, 2) + '\n',
    )
  }

  // ── settings: `const zh = {...}` → generated JSON ──
  convertInlineTs(outputs, 'settings', 'src/translations.ts', 'const zh =', (sourcePath, converted) => {
    outputs.set(
      resolve(root, 'apps/settings/src/translations.zh-hant.generated.json'),
      JSON.stringify(converted, null, 2) + '\n',
    )
  })

  // ── homepage: inline i18n dict zh block → generated JSON ──
  {
    const sourcePath = resolve(root, 'apps/homepage/js/i18n.js')
    const source = readFileSync(sourcePath, 'utf8')
    // Extract the zh subtree only; the imported zh-Hant map is the output
    // of this step and must not be evaluated.
    const converted = convertTree(extractObject(source, 'zh: {', [], []))
    outputs.set(
      resolve(root, 'apps/homepage/js/zh-hant.generated.json'),
      JSON.stringify(converted, null, 2) + '\n',
    )
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
    outputs.set(resolve(root, 'apps/monitor-choice/js/i18n-zh-hant.js'), header + lines.join('\n') + footer)
  }

  // ── app-manifest: add zhHant overrides next to every zh field ──
  {
    let source = readFileSync(resolve(root, 'packages/app-manifest/manifest.js'), 'utf8')
    // navLabel/description/subtitle/title: zh string literals gain a zhHant literal
    const stringFields = ['navLabel', 'description', 'subtitle', 'title']
    for (const field of stringFields) {
      const re = new RegExp(`(${field}: \\{ zh: )('(?:[^'\\\\]|\\\\.)*')(, en:)`, 'g')
      source = source.replace(re, (_, a, lit, b) => `${a}${lit}, zhHant: ${JSON.stringify(convert(JSON.parse(lit.replace(/'/g, '"'))))}${b}`)
    }
    // multiline description blocks inside presentation objects
    source = source.replace(/(description: \{\n        zh: )('(?:[^'\\]|\\.)*')(,\n        en:)/g, (_, a, lit, b) => `${a}${lit},\n        zhHant: ${JSON.stringify(convert(JSON.parse(lit.replace(/'/g, '"'))))}${b}`)
    // keywords: zh arrays gain a zhHant array
    source = source.replace(/keywords: \{\n      zh: \[([^\]]*)\],\n      en: \[/g, (_, zhList) => {
      const items = [...zhList.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1])
      const convertedList = items.map((item) => `'${convert(item).replace(/'/g, "\\'")}'`).join(', ')
      return `keywords: {\n      zh: [${zhList}],\n      zhHant: [${convertedList}],\n      en: [`
    })
    outputs.set(resolve(root, 'packages/app-manifest/manifest.js'), source)
  }

  return outputs
}

async function main() {
  const outputs = generateZhHant()
  for (const [path, content] of outputs) {
    writeFileSync(path, content)
    console.log('[gen] %s', path.slice(root.length))
  }
  console.log('[gen] done (%d files)', outputs.size)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main()
}
