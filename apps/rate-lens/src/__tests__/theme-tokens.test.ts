import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Regression guard for the theme contrast bug:
 * Defining `--color-base` in `@theme inline` made Tailwind generate
 * `.text-base { color: var(--base) }`, which clobbered Tailwind's
 * built-in `text-base` font-size utility (used by shadcn Input,
 * ConclusionPanel, ReverseResultCards). Result: input/heading text
 * rendered in the page-background color → invisible.
 *
 * `base` must NOT be exposed as a color utility. Use `bg-background`
 * or `var(--base)` for the page background.
 */
describe('theme token collision guard', () => {
  it('index.css does NOT expose --color-base (would clobber text-base font-size)', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')
    expect(css).not.toMatch(/--color-base\s*:/)
  })

  it('index.css keeps --base as a raw var (used by --background and body)', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')
    expect(css).toMatch(/--base:\s*#/)
  })
})
