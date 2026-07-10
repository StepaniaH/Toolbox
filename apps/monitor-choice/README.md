# Monitor Choice

A privacy-first, zero-dependency interactive tool for understanding display parameters — PPI, viewing distance, color gamut, panel technologies — to help you make informed monitor and TV choices.

**[中文文档](README.zh-CN.md)**

## Features

- **Sharpness Lab** — Real-time PPI/PPD calculation with pixel-level text rendering comparison
- **Size & Distance** — Interactive 3D room scene with drag-to-rotate perspective projection; FOV/THX/SMPTE distance recommendations
- **Color Space** — CIE 1931 chromaticity diagram with interactive gamut overlay (sRGB / DCI-P3 / Rec.2020)
- **Scenario Guide** — 9 practical usage scenarios with tailored parameter recommendations
- **Panel Encyclopedia** — IPS / VA / OLED / Mini-LED deep-dive, including interface bandwidth calculator

## Quick Start

No build step. No dependencies. Just open it:

```bash
open index.html
# or
python3 -m http.server 8080
```

## Privacy

Zero external requests, zero tracking, zero cookies, zero third-party scripts. All calculations run entirely in your browser. Settings are stored in `localStorage` only if explicitly enabled, and can be cleared at any time.

## Tech Stack

HTML + CSS + Vanilla JavaScript (Canvas 2D), zero dependencies.

## License

[MIT](LICENSE) © 2026 Stepania H
