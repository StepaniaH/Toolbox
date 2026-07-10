# Monitor Choice

A privacy-first interactive tool for understanding display parameters — PPI, viewing distance, color gamut, panel technologies — to help you make informed monitor and TV choices.

**[中文文档](README.zh-CN.md)**

## Features

- **Sharpness Lab** — Real-time PPI/PPD calculation with pixel-level text rendering comparison
- **Size & Distance** — Interactive 3D room scene with drag-to-rotate perspective projection; FOV/THX/SMPTE distance recommendations
- **Color Space** — CIE 1931 chromaticity diagram with interactive gamut overlay (sRGB / DCI-P3 / Rec.2020)
- **Scenario Guide** — 9 practical usage scenarios with tailored parameter recommendations
- **Panel Encyclopedia** — IPS / VA / OLED / Mini-LED deep-dive, including interface bandwidth calculator

## Development

Run it through the repository workspace so Vite can resolve the shared Toolbox platform packages:

```bash
pnpm --filter=@toolbox/monitor-choice dev
pnpm --filter=@toolbox/monitor-choice build
pnpm --filter=@toolbox/monitor-choice test
pnpm --filter=@toolbox/monitor-choice lint
```

Production assets are emitted to `dist/` with base path `/monitor-choice/`.

## Privacy

Zero external requests, zero tracking, zero cookies, zero third-party scripts. All calculations run entirely in your browser. Settings are stored in `localStorage` only if explicitly enabled, and can be cleared at any time.

## Tech Stack

Vanilla JavaScript + Vite + CSS + Canvas 2D. Shared theme, navigation, and language state come from workspace packages and are bundled locally at build time.

## License

[MIT](LICENSE) © 2026 Stepania H
