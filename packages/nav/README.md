# @toolbox/nav

Shared navigation bar for every Toolbox app — the single source of truth for
the cross-tool menu. Ships two interchangeable surfaces over the same CSS:

- **`nav-bar.js`** — vanilla JS, auto-mounts into `<div id="toolbox-nav"></div>`. Used by the static apps (`homepage`, `monitor-choice`).
- **`NavBar.tsx`** — React component, `<NavBar currentApp="rate-lens" />`. Used by the React apps (`rate-lens`, `chrono-sphere`, `sane-units`).

Both render the same layout:

```
[ 🧰 Toolbox ▾ ]   RateLens  ChronoSphere  Monitor Choice  SaneUnits   [ 🌓 ][ ☰ ]
|-- left drop --| |--------------- center quick links --------------| |-- right --|
```

- **Left** — `🧰 Toolbox` dropdown. Hover (desktop) or tap (touch) to expand the full tool list with one-line descriptions.
- **Center** — quick links to every tool. The current tool is highlighted.
- **Right** — theme toggle (delegates to `@toolbox/theme`'s `toggleTheme`) + a hamburger that collapses the center links into a slide-down drawer on narrow screens.

## Tool list

| id | label | href | description |
|----|-------|------|-------------|
| `home` | 首页 / Home | `/` | Toolbox navigation hub |
| `rate-lens` | RateLens | `/rate-lens/` | AI model pricing calculator |
| `chrono-sphere` | ChronoSphere | `/chrono-sphere/` | Date & timezone utility |
| `monitor-choice` | Monitor Choice | `/monitor-choice/` | Display parameter lab |
| `sane-units` | SaneUnits | `/sane-units/` | Unit conversion & estimation |

When adding a new tool, append it to `TOOLS` in `nav-bar.js` **and** `NAV_APPS`
in `NavBar.tsx` (per `docs/AGENTS.md` §五, step 7). The two lists must stay in
sync.

## Setup

Add the workspace dependency:

```bash
pnpm --filter=@toolbox/<app> add @toolbox/theme@workspace:* @toolbox/nav@workspace:*
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
| `> 768px` | Full bar: brand dropdown + inline quick links + theme toggle. Dropdown opens on hover (and on click/focus). |
| `≤ 768px` | Quick links collapse into a hamburger drawer. Brand dropdown becomes tap-only (`@media (hover: none)` disables hover-reveal). |

`prefers-reduced-motion` shortens all transitions to ~0ms.

## Privacy

Like the rest of Toolbox, this package is fully client-side — no network
requests, no tracking, no cookies. Navigation links are plain `<a href>` to
absolute paths (`/`, `/rate-lens/`, …) so they work under the single-domain
path-routed deployment described in `docs/PLAN.md` (ADR-2).

## License

MIT
