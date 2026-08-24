export type AppStatus = 'hidden' | 'preview' | 'stable'

export type Lang = 'zh' | 'zh-Hant' | 'en'

export type LocalizedText = Readonly<{
  zh: string
  zhHant?: string
  en: string
}>

export type LocalizedKeywords = Readonly<{
  zh: readonly string[]
  zhHant?: readonly string[]
  en: readonly string[]
}>

/** Resolve a localized value for the UI language; zh-Hant falls back to zh. */
export declare function localizedText(text: LocalizedText, lang: Lang): string
export declare function localizedKeywords(
  keywords: LocalizedKeywords,
  lang: Lang,
): readonly string[]

export type AppIcon = Readonly<{
  viewBox: string
  svg: string
}>

export type CardPresentation = Readonly<{
  title?: LocalizedText
  subtitle: LocalizedText
  description: LocalizedText
  badges: readonly string[]
}>

export type ToolboxApp = Readonly<{
  id: string
  navId: string
  path: '/' | `/${string}/`
  name: string
  navLabel: LocalizedText
  description: LocalizedText
  keywords: LocalizedKeywords
  icon: AppIcon
  presentation?: CardPresentation
  status: AppStatus
}>

export type ToolboxAppInput = Omit<ToolboxApp, 'navId' | 'status'> & {
  navId?: string
  status?: AppStatus
}

export const APP_STATUSES: readonly AppStatus[]
export const TOOLBOX_RELEASE: string
export const TOOLBOX_APPS: readonly ToolboxApp[]
export function defineApp(input: ToolboxAppInput): ToolboxApp
export function getStableApps(): ToolboxApp[]
export function getAppById(id: string): ToolboxApp | undefined
