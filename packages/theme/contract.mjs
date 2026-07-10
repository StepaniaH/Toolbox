export const THEME_CONTRACT_VERSION = 1
export const THEME_STORAGE_KEY = 'toolbox-theme'
export const THEME_ATTRIBUTE = 'data-theme'
export const DEFAULT_THEME = 'dark'
export const THEMES = Object.freeze(['dark', 'light'])

export const SEMANTIC_COLOR_TOKENS = Object.freeze([
  '--color-bg',
  '--color-bg-elevated',
  '--color-bg-muted',
  '--color-text',
  '--color-text-muted',
  '--color-text-faint',
  '--color-border',
  '--color-border-strong',
  '--color-primary',
  '--color-primary-fg',
  '--color-secondary',
  '--color-secondary-fg',
  '--color-accent',
  '--color-accent-fg',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-danger-fg',
  '--color-info',
  '--color-ring',
  '--color-input',
])

export const FOUNDATION_TOKENS = Object.freeze([
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-pill',
  '--font-sans',
  '--font-mono',
])

export function isTheme(value) {
  return THEMES.includes(value)
}
