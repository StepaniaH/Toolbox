export type ToolboxTheme = 'dark' | 'light'
export type ToolboxThemeFamily = 'catppuccin' | 'gruvbox' | 'solarized'

export declare const THEME_CONTRACT_VERSION: 2
export declare const THEME_STORAGE_KEY: 'toolbox-theme'
export declare const THEME_ATTRIBUTE: 'data-theme'
export declare const DEFAULT_THEME: 'dark'
export declare const THEMES: readonly ToolboxTheme[]
export declare const THEME_FAMILY_STORAGE_KEY: 'toolbox-theme-family'
export declare const THEME_FAMILY_ATTRIBUTE: 'data-theme-family'
export declare const DEFAULT_THEME_FAMILY: ToolboxThemeFamily
export declare const THEME_FAMILIES: readonly ToolboxThemeFamily[]
export declare const SEMANTIC_COLOR_TOKENS: readonly string[]
export declare const FOUNDATION_TOKENS: readonly string[]
export declare function isTheme(value: unknown): value is ToolboxTheme
export declare function isThemeFamily(value: unknown): value is ToolboxThemeFamily
