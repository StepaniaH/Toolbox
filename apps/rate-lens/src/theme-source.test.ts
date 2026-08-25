import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

describe('theme source contract', () => {
  it('keeps raw palette definitions out of the app stylesheet', () => {
    expect(css).not.toMatch(/--base:\s*#/)
    expect(css).not.toMatch(/--surface-\d:\s*#/)
    expect(css).not.toMatch(/--ctp-[a-z0-9-]+\s*:/)
  })

  it('derives shadcn tokens from shared theme aliases', () => {
    expect(css).toContain('--background: var(--base)')
    expect(css).toContain('--primary: var(--blue)')
    expect(css).toContain('--ring: var(--blue)')
  })

  it('pre-paint reads the shared theme key with the legacy fallback', () => {
    expect(html).toContain("'toolbox-theme'")
    expect(html).toContain('ratelens-theme')
    expect(html).toMatch(/setAttribute\('data-theme'/)
  })
})
