# Toolbox

> What others skip, these tools count.

A collection of privacy-first web tools. Core calculations run locally in your browser — no first-party backend, no tracking, and no cookies.

> Privacy note: form inputs are not uploaded. RateLens uses a local reference rate by default and contacts the disclosed public third-party services only when the user explicitly requests a live rate.

**Live**: [tools.s-ark.xyz](https://tools.s-ark.xyz) · **Source**: [github.com/StepaniaH/Toolbox](https://github.com/StepaniaH/Toolbox)

---

## Tools

| Tool | Path | Description | Stack |
|------|------|-------------|-------|
| Homepage | `/` | Navigation hub | HTML + CSS + Vanilla JS |
| RateLens | `/rate-lens/` | AI model pricing calculator | React + TS + Vite + Tailwind |
| ChronoSphere | `/chrono-sphere/` | Date & timezone utility | React + TS + Vite |
| Monitor Choice | `/monitor-choice/` | Display parameter lab | HTML + Vanilla JS (Canvas) |
| SaneUnits | `/sane-units/` | Unit conversion & estimation | React + TS + Vite |

---

## Design Principles

- **Privacy-first** — core calculations stay client-side; no first-party backend, tracking, or cookies. External data access must be visible, optional, and have a local fallback.
- **Bilingual** — every tool ships both Chinese (zh) and English (en) interfaces.
- **Catppuccin theme** — Frappé (dark) + Latte (light); adoption of the shared theme contract is in progress.
- **MIT licensed** — all tools are open source under the MIT license.
- **Static deployment** — served as static files behind Caddy with path-based routing under one domain.

---

## Quick Start

```bash
pnpm install && pnpm dev
```

Individual tools:

```bash
pnpm --filter=@toolbox/rate-lens dev   # run a single tool
pnpm build                              # build all tools
pnpm test                               # test all tools
```

See [`docs/INDEX.md`](./docs/INDEX.md) for the project overview, [`docs/PLAN.md`](./docs/PLAN.md) for the architecture direction, [`docs/NEW_TOOL.md`](./docs/NEW_TOOL.md) for the new-tool playbook, and [`docs/AGENTS.md`](./docs/AGENTS.md) for development conventions.

---

## License

MIT
