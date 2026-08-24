export const THEME_CONTRACT_VERSION: 2
export const THEME_STORAGE_KEY: 'toolbox-theme'
export const THEME_ATTRIBUTE: 'data-theme'
export const DEFAULT_THEME: 'dark'
export const THEMES: readonly ['dark', 'light']
export const THEME_FAMILY_STORAGE_KEY: 'toolbox-theme-family'
export const THEME_FAMILY_ATTRIBUTE: 'data-theme-family'
export const DEFAULT_THEME_FAMILY: 'catppuccin'
export const THEME_FAMILIES: readonly ['catppuccin', 'gruvbox', 'solarized']
export const SEMANTIC_COLOR_TOKENS: readonly string[]
export const FOUNDATION_TOKENS: readonly string[]
export function isTheme(value: unknown): value is 'dark' | 'light'
export function isThemeFamily(value: unknown): value is 'catppuccin' | 'gruvbox' | 'solarized'
