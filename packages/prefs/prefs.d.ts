export const PREFS_CONTRACT_VERSION: 1
export const HOMEPAGE_PREFS_STORAGE_KEY: 'toolbox-homepage-prefs'
export const HOMEPAGE_PREFS_SCHEMA_VERSION: 1
export const DEFAULT_HOMEPAGE_PREFS: Readonly<{
  schema: 1
  hiddenIds: readonly string[]
  order: readonly string[]
  limit: null | number
}>

export type HomepagePrefs = {
  schema: 1
  hiddenIds: string[]
  order: string[]
  limit: null | number
}

export function normalizeHomepagePrefs(input: unknown, appIds: readonly (string | { id: string })[]): HomepagePrefs
export function readHomepagePrefs(appIds: readonly (string | { id: string })[], storage?: Storage): HomepagePrefs
export function writeHomepagePrefs(prefs: unknown, appIds: readonly (string | { id: string })[], storage?: Storage): HomepagePrefs
export function clearHomepagePrefs(storage?: Storage): void
export function applyHomepagePrefs<T extends { id: string }>(apps: readonly T[], prefs: HomepagePrefs): T[]
