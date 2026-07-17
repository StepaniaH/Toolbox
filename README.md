# Toolbox

> What others skip, these tools count.

A collection of privacy-first web tools. Core calculations run locally in your browser — no first-party backend, no tracking, and no cookies.

> Privacy note: form inputs are not uploaded. RateLens automatically requests only the current USD/CNY rate from the disclosed public services; if both fail, it asks for manual input instead of substituting a hardcoded rate.

**Live**: [toolbox.stepaniah.me](https://toolbox.stepaniah.me) · **Source**: [github.com/StepaniaH/Toolbox](https://github.com/StepaniaH/Toolbox)

---

## Tools

| Tool | Path | Description | Stack |
|------|------|-------------|-------|
| Homepage | `/` | Navigation hub | HTML + CSS + Vanilla JS |
| RateLens | `/rate-lens/` | AI model pricing calculator | React + TS + Vite + Tailwind |
| ChronoSphere | `/chrono-sphere/` | Date & timezone utility | React + TS + Vite |
| Monitor Choice | `/monitor-choice/` | Display parameter lab | HTML + Vanilla JS (Canvas) |
| SaneUnits | `/sane-units/` | Unit conversion & estimation | React + TS + Vite |
| FormTran | `/image-converter/` | Local file, image, table, PDF, and ZIP workspace | React + TS + Vite |
| CryptoLab | `/crypto-lab/` | Local cryptography, JWT inspection, and public-key QR sharing | React + TS + Vite |

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

See [`docs/INDEX.md`](./docs/INDEX.md) for the project overview, [`docs/PLAN.md`](./docs/PLAN.md) for the architecture direction, [`docs/RELEASE.md`](./docs/RELEASE.md) for the fixed release and rollback flow, [`docs/NEW_TOOL.md`](./docs/NEW_TOOL.md) for the new-tool playbook, and [`docs/AGENTS.md`](./docs/AGENTS.md) for development conventions.

For a new tool, the maintainer only needs to describe the product normally. The agent must
automatically use [`$develop-toolbox-tool`](./.agents/skills/develop-toolbox-tool/SKILL.md),
create a local `newdev/<tool-id>` from `dev`, and own the brief, platform integration,
localized docs, privacy, and tests. Candidate branches are not pushed by default; an
explicitly authorized integration review merges locally into `dev`, then pushes only `dev`
when requested.

---

## License

MIT
