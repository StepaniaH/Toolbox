export type ToolboxTheme = 'dark' | 'light'

export declare const THEME_CONTRACT_VERSION: 1
export declare const THEME_STORAGE_KEY: 'toolbox-theme'
export declare const THEME_ATTRIBUTE: 'data-theme'
export declare const DEFAULT_THEME: 'dark'
export declare const THEMES: readonly ToolboxTheme[]
export declare const SEMANTIC_COLOR_TOKENS: readonly string[]
export declare const FOUNDATION_TOKENS: readonly string[]
export declare function isTheme(value: unknown): value is ToolboxTheme
