import { readFileSync } from 'node:fs'

const failures = []

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

function requireIdentical(canonicalPath, copyPath) {
  if (read(canonicalPath) !== read(copyPath)) {
    failures.push(`shared-copy-drift: ${copyPath} differs from ${canonicalPath}`)
  }
}

function ruleBody(css, selector) {
  const start = css.indexOf(selector)
  if (start < 0) return null
  const open = css.indexOf('{', start + selector.length)
  const close = css.indexOf('}', open + 1)
  if (open < 0 || close < 0) return null
  return css.slice(open + 1, close)
}

const navCss = read('packages/nav/nav-bar.css')
const actionBase = ruleBody(navCss, '.toolbox-nav-icon-btn')
const actionHover = ruleBody(navCss, '.toolbox-nav-icon-btn:hover')
const actionFocus = ruleBody(navCss, '.toolbox-nav-icon-btn:focus-visible')

if (!actionBase || /outline\s*:\s*(?:none|0)\b/.test(actionBase)) {
  failures.push('nav-focus-contract: base icon action must not suppress outlines')
}
if (!actionHover || /background(?:-color)?\s*:/.test(actionHover)) {
  failures.push('nav-hover-contract: language/theme hover must not draw a background box')
}
if (
  !actionFocus ||
  !/outline\s*:\s*2px\s+solid\s+var\(--ctp-blue\)/.test(actionFocus) ||
  /outline\s*:\s*(?:none|0)\b/.test(actionFocus)
) {
  failures.push('nav-focus-contract: focus-visible must provide a 2px blue outline')
}

for (const app of ['homepage', 'monitor-choice']) {
  requireIdentical('packages/nav/nav-bar.css', `apps/${app}/nav-bar.css`)
  requireIdentical('packages/nav/nav-bar.js', `apps/${app}/nav-bar.js`)
}

if (failures.length > 0) {
  console.error('[contracts] Contract violations:')
  for (const failure of failures) console.error(`[contracts] ${failure}`)
  process.exitCode = 1
} else {
  console.log('[contracts] Nav interaction and static-copy contracts passed.')
}
