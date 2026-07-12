export type AppStatus = 'hidden' | 'preview' | 'stable'

export type LocalizedText = Readonly<{
  zh: string
  en: string
}>

export type AppIcon = Readonly<{
  viewBox: string
  svg: string
}>

export type ToolboxApp = Readonly<{
  id: string
  navId: string
  path: '/' | `/${string}/`
  name: string
  navLabel: LocalizedText
  description: LocalizedText
  icon: AppIcon
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
