# Toolbox

> What others skip, these tools count.

A collection of privacy-first web tools. All computation runs locally in your browser — zero backends, zero tracking, zero cookies.

**Live**: [tools.s-ark.xyz](https://tools.s-ark.xyz) · **Source**: [github.com/StepaniaH/Toolbox](https://github.com/StepaniaH/Toolbox)

---

## Tools

| Tool | Path | Description | Stack |
|------|------|-------------|-------|
| Homepage | `/` | Navigation hub | HTML + CSS + Vanilla JS |
| RateLens | `/rate-lens/` | AI model pricing calculator | React + TS + Vite + Tailwind |
| ChronoSphere | `/chrono-sphere/` | Date & timezone utility | React + TS + Vite |
| Monitor Choice | `/monitor-choice/` | Display parameter lab | HTML + Vanilla JS (Canvas) |
| SaneUnits | `/sane-units/` | Unit conversion & estimation | React + Vite |

---

## Design Principles

- **Privacy-first** — fully client-side; no backends, no tracking, no cookies, no third-party scripts.
- **Bilingual** — every tool ships both Chinese (zh) and English (en) interfaces.
- **Catppuccin theme** — Frappé (dark, default) + Latte (light), unified through a shared theme package.
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

See [`docs/INDEX.md`](./docs/INDEX.md) for the full project overview and [`docs/AGENTS.md`](./docs/AGENTS.md) for development conventions.

---

## License

MIT
