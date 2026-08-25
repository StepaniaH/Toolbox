# Settings

## Brief

```yaml
id: settings
route: /settings/
name: Settings
problem: >
  Preferences (interface language, theme mode, palette family, homepage card
  visibility/order/limit) were previously scattered or hard-coded; users need
  one place to control them, stored locally.
inputs: >
  Reads the shared preference keys (toolbox-lang, toolbox-theme,
  toolbox-theme-family) and toolbox-homepage-prefs; writes them through
  @toolbox/i18n core, window.ToolboxTheme, and @toolbox/prefs.
outputs: >
  Persisted preferences that every stable app consumes on load; immediate
  visual and textual feedback in the page itself.
assumptions: >
  The shared storage keys are the single source of truth; apps follow them on
  load (no app-private override). Homepage honors hiddenIds/order/limit from
  @toolbox/prefs.
privacy: pure client-side; no network requests; no account or backend
offline_fallback: fully offline by default
non_goals:
  - account sync or cross-device persistence
  - per-app theme overrides (apps follow the global choice)
  - editing individual tool behavior beyond homepage card layout
acceptance:
  - all visible copy renders in zh, zh-Hant, and en with no raw translation keys
  - switching palette family changes computed page background in both modes
  - language switch updates document lang and persists across reload
  - homepage list reflects hide/show/order/limit edits immediately and after reload
```

## Usage

Open `/settings/` from the gear icon in any Toolbox app.

- **Appearance** — dark/light segmented control; palette swatches (Catppuccin,
  Gruvbox, Solarized); language list showing each language's native name first,
  current-language name second.
- **Homepage** — reorder tools, hide or show cards, cap the number of visible
  cards, reset to defaults. Changes apply immediately.

## Privacy

All computation stays in the browser. The app issues no external requests,
writes only the shared preference keys listed above plus
`toolbox.settings.*` for its own state, and reads nothing else.

## Development

```bash
pnpm install
pnpm --filter=@toolbox/settings dev
pnpm --filter=@toolbox/settings build
pnpm --filter=@toolbox/settings test
pnpm --filter=@toolbox/settings test:browser
pnpm --filter=@toolbox/settings lint
```

The production browser smoke drives the real controls end to end (mode
segments, palette swatches including computed backgrounds, language list,
persistence) and asserts no raw translation key reaches the DOM.
