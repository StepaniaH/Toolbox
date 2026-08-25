// @toolbox/prefs — shared local preference storage.
//
// Preferences are device-local by contract: they live in localStorage, never
// leave the browser, and every reader must tolerate missing, corrupt or
// partially written values by falling back to defaults.

export const PREFS_CONTRACT_VERSION = 1

export const HOMEPAGE_PREFS_STORAGE_KEY = 'toolbox-homepage-prefs'
export const HOMEPAGE_PREFS_SCHEMA_VERSION = 1

export const DEFAULT_HOMEPAGE_PREFS = Object.freeze({
  schema: HOMEPAGE_PREFS_SCHEMA_VERSION,
  hiddenIds: [],
  order: [],
  limit: null,
})

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Normalize untrusted input into a valid homepage prefs object. Unknown or
 * duplicate ids are dropped, order entries outside appIds are ignored, and
 * limit is clamped to 1..appIds.length or null (no limit).
 */
export function normalizeHomepagePrefs(input, appIds) {
  const ids = appIds.map((app) => app.id ?? app)
  const idSet = new Set(ids)
  const source = isPlainObject(input) ? input : {}

  const hiddenIds = []
  for (const id of Array.isArray(source.hiddenIds) ? source.hiddenIds : []) {
    if (idSet.has(id) && !hiddenIds.includes(id)) hiddenIds.push(id)
  }

  const order = []
  for (const id of Array.isArray(source.order) ? source.order : []) {
    if (idSet.has(id) && !order.includes(id)) order.push(id)
  }

  const rawLimit = source.limit
  let limit = null
  if (Number.isFinite(rawLimit)) {
    limit = Math.min(Math.max(Math.trunc(rawLimit), 1), ids.length)
  }

  return {
    schema: HOMEPAGE_PREFS_SCHEMA_VERSION,
    hiddenIds,
    order,
    limit,
  }
}

export function readHomepagePrefs(appIds, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(HOMEPAGE_PREFS_STORAGE_KEY)
    if (!raw) return normalizeHomepagePrefs(null, appIds)
    return normalizeHomepagePrefs(JSON.parse(raw), appIds)
  } catch {
    return normalizeHomepagePrefs(null, appIds)
  }
}

export function writeHomepagePrefs(prefs, appIds, storage = globalThis.localStorage) {
  const normalized = normalizeHomepagePrefs(prefs, appIds)
  try {
    storage?.setItem(HOMEPAGE_PREFS_STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // Persistence failures must not break rendering.
  }
  return normalized
}

export function clearHomepagePrefs(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(HOMEPAGE_PREFS_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Apply prefs to the stable tool list: drop hidden ids, order the rest
 * (unlisted ids keep manifest order after the pinned ones), then apply the
 * optional limit.
 */
export function applyHomepagePrefs(apps, prefs) {
  const hidden = new Set(prefs.hiddenIds)
  const rank = new Map(prefs.order.map((id, index) => [id, index]))
  const visible = apps.filter((app) => !hidden.has(app.id))
  visible.sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER
    const rb = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER
    return ra === rb ? 0 : ra - rb
  })
  return prefs.limit === null ? visible : visible.slice(0, prefs.limit)
}
