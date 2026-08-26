import { readFileSync, readdirSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// P3.1 precedent: translucent surfaces + backdrop blur force large composited
// repaints on scroll and input. ChronoSphere panels are opaque; this guard
// keeps backdrop-filter from creeping back in.
const stylesDir = resolve(dirname(fileURLToPath(import.meta.url)), 'styles')

function cssFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.css'))
    .map((name) => resolve(dir, name))
}

describe('chrono-sphere styles stay off the backdrop-filter path', () => {
  it('no stylesheet declares backdrop-filter', () => {
    for (const file of cssFiles(stylesDir)) {
      const css = readFileSync(file, 'utf8')
      expect(css).not.toMatch(/backdrop-filter/)
    }
  })

  it('panel and popover surfaces are opaque', () => {
    const theme = readFileSync(resolve(stylesDir, 'theme.css'), 'utf8')
    for (const line of theme.split('\n')) {
      if (/--surface-panel:/.test(line) || /--surface-popover:/.test(line)) {
        expect(line, line.trim()).not.toMatch(/transparent/)
      }
    }
  })
})
