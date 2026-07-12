# @toolbox/nav

Shared navigation bar for every Toolbox app. Both surfaces project the stable
entries from `@toolbox/app-manifest` over the same CSS:

- **`nav-bar.js`** — vanilla JS, auto-mounts into `<div id="toolbox-nav"></div>`. Used by the Vanilla apps (`homepage`, `monitor-choice`).
- **`NavBar.tsx`** — React component, `<NavBar currentApp="rate-lens" />`. Used by the React apps (`rate-lens`, `chrono-sphere`, `sane-units`).

Both render the same layout:

```
[ 🧰 Toolbox ▾ ]                                                 [ ◎ ][ ☾ ]
|-- single tool menu --|                                | language | theme |
```

- **Left** — `🧰 Toolbox` dropdown. Hover (desktop) or tap (touch) to expand the full tool list with one-line descriptions.
- **Right** — a language icon that opens an extensible, current-selection menu plus a sun/moon theme action.

The Toolbox dropdown remains the only tool switcher at narrow widths, so mobile users do not see a duplicate hamburger directory.

Language/theme actions intentionally have no background box on pointer hover; hover uses color only. Keyboard `focus-visible` uses a 2px blue outline. `pnpm check:contracts` enforces this behavior and verifies manifest consumption.

## Tool list

| id | label | href | description |
|----|-------|------|-------------|
| `home` | 首页 / Home | `/` | Toolbox navigation hub |
| `rate-lens` | RateLens | `/rate-lens/` | AI model pricing calculator |
| `chrono-sphere` | ChronoSphere | `/chrono-sphere/` | Date & timezone utility |
| `monitor-choice` | Monitor Choice | `/monitor-choice/` | Display parameter lab |
| `sane-units` | SaneUnits | `/sane-units/` | Unit conversion & estimation |

This table is generated in code from `@toolbox/app-manifest`. Add a single
manifest entry (default `hidden`); do not edit `TOOLS` or `NAV_APPS` manually.

## Setup

Add the workspace dependency:

```bash
pnpm --filter=@toolbox/<app> add @toolbox/i18n@workspace:* @toolbox/theme@workspace:* @toolbox/nav@workspace:*
```

`@toolbox/nav` depends on `@toolbox/theme` for the `--ctp-*` CSS variables and
the runtime `toggleTheme` function — load both.

### Vanilla JS apps (`homepage`, `monitor-choice`)

```html
<head>
  <link rel="stylesheet" href="@toolbox/theme/styles.css">
  <link rel="stylesheet" href="@toolbox/nav/nav-bar.css">
</head>
<body>
  <!-- mount point; the bar is position:fixed so place this anywhere -->
  <div id="toolbox-nav"></div>

  <!-- theme toggle runtime (provides window.ToolboxTheme.toggleTheme) -->
  <script src="@toolbox/theme/toggle.js"></script>
  <!-- nav auto-mounts into #toolbox-nav on DOMContentLoaded -->
  <script src="@toolbox/nav/nav-bar.js"></script>
</body>
```

Because the bar is `position: fixed`, reserve top spacing on the page:

```css
body { padding-top: var(--toolbox-nav-height, 56px); }
```

The active tool is auto-detected from `location.pathname`. To override, call
`mount` explicitly instead of relying on auto-mount:

```html
<div id="toolbox-nav"></div>
<script src="@toolbox/theme/toggle.js"></script>
<script src="@toolbox/nav/nav-bar.js"></script>
<script>
  ToolboxNav.mount("#toolbox-nav", { currentApp: "monitor-choice" });
</script>
```

`mount` options:

| option | type | default | description |
|--------|------|---------|-------------|
| `currentApp` | `string` | auto-detect from path | Active tool id |
| `onToggleTheme` | `() => void` | `window.ToolboxTheme.toggleTheme()` | Override the theme toggle |

### React apps (`rate-lens`, `chrono-sphere`, `sane-units`)

```tsx
import { NavBar } from "@toolbox/nav/NavBar.tsx";
import "@toolbox/nav/nav-bar.css";
// make sure @toolbox/theme's index.css + toggle.js are loaded too

export function App() {
  return (
    <>
      <NavBar currentApp="rate-lens" />
      <div style={{ paddingTop: "var(--toolbox-nav-height, 56px)" }}>
        {/* …app content… */}
      </div>
    </>
  );
}
```

Props:

| prop | type | default | description |
|------|------|---------|-------------|
| `currentApp` | `string` | — | id of the active tool (highlights its link) |
| `apps` | `NavApp[]` | `NAV_APPS` | Override the tool list |
| `onToggleTheme` | `() => void` | `window.ToolboxTheme.toggleTheme` | Override the theme toggle |
| `lang` | `"zh" \| "en"` | `localStorage("toolbox-lang")` → `navigator.language` | Label language |
| `rightSlot` | `ReactNode` | — | Extra nodes before the theme button |
| `className` | `string` | — | Extra class on the root `<header>` |

The component also exports `NAV_APPS` and the `NavApp` / `NavBarProps` types.

## Styling

All rules are scoped under `.toolbox-nav` so this package is safe to import
into any app. Colors reference the `--ctp-*` variables defined by
`@toolbox/theme`, so the bar follows the Catppuccin Frappé (dark) / Latte
(light) palettes automatically when `<html data-theme="…">` flips.

CSS custom properties exposed for the host page:

| variable | default | description |
|----------|---------|-------------|
| `--toolbox-nav-height` | `56px` | Bar height; reference it for top padding |

Responsive behavior:

| viewport | behavior |
|----------|----------|
| `> 768px` | Brand tool dropdown + language menu + theme toggle. Menus open on hover, click or keyboard activation. |
| `≤ 768px` | The same controls remain; Toolbox is the single tap-to-open tool menu and no duplicate directory is rendered. |

`prefers-reduced-motion` shortens all transitions to ~0ms.

## Privacy

Like the rest of Toolbox, this package is fully client-side — no network
requests, no tracking, no cookies. Navigation links are plain `<a href>` to
absolute paths (`/`, `/rate-lens/`, …) so they work under the single-domain
path-routed deployment described in `docs/PLAN.md` (ADR-2).

## License

MIT
