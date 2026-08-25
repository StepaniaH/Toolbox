# @toolbox/prefs

Shared local preference storage. Preferences are device-local by contract:
they live in `localStorage`, never leave the browser, and every reader falls
back to defaults on missing, corrupt or partially written values.

- `toolbox-homepage-prefs` — homepage personalization written by the Settings
  app and consumed by the Homepage: `{ schema, hiddenIds, order, limit }`.
  `hiddenIds`/`order` only reference stable tool ids; unknown ids are dropped
  on read. `limit: null` means no limit.
- `PREFS_CONTRACT_VERSION` mirrors the package `contractVersion` field and is
  checked by `pnpm check:contracts`.
