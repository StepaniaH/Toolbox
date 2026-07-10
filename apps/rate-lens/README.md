# RateLens

> AI model pricing multiplier calculator — compare what you actually pay against official API prices.
>
> 中文文档：[README.zh-CN.md](./README.zh-CN.md)

RateLens is a 100% client-side calculator for AI model API pricing. It supports two modes:

- **Forward (倍率正算)** — enter your recharge amount, credited balance, and the platform's group multiplier; get the recharge ratio, 1:1 equivalent multiplier, and cost-as-%-of-official, plus a live price table for every model.
- **Reverse (扣费反推)** — pick a reference model, enter what you actually paid (¥/1M tokens), and back out the real group multiplier, equivalent multiplier, and a cheaper / flat / more-expensive verdict per dimension.

No backend, no tracking. All math runs in the browser.

## Features

- **Two calculation modes** with shared recharge/balance/exchange-rate inputs
- **Live price table** for Claude (5 models) and GPT & Codex (6 models), with semantic pills (green = cheaper, yellow = flat, red = more expensive) and per-cell formulas
- **Auto exchange rate** with multi-endpoint fallback (manual override anytime)
- **Catppuccin theme** — Frappe (dark, default) / Latte (light), persisted to `localStorage`, respects system preference
- **Responsive** across 375 / 768 / 1024 / 1440 breakpoints; price table scrolls horizontally on mobile
- **Persistent state** — refresh the page and your inputs, mode, and price-table selection are restored
- **Error boundary** at the root; graceful offline fallback for the exchange rate

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Theme | Catppuccin Frappe / Latte (CSS custom properties) |
| Icons | lucide-react |
| Tests | Vitest 3 + @testing-library/react + jsdom |

## Getting started

```bash
npm install
npm run dev        # start dev server (http://localhost:5173)
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build
npm test           # run the unit/UI test suite (55 tests)
```

## Project structure

```
src/
├── calc/          # forward.ts, reverse.ts — pure calculation logic
├── components/    # feature components + layout/ + ui/ (shadcn)
├── data/          # models.ts — Claude & GPT/Codex pricing
├── hooks/         # use-theme, use-local-storage, use-exchange-rate
├── lib/           # utils.ts — cn, parseNum, formatters, classifyVerdict
├── types/         # TypeScript domain types
└── __tests__/     # unit + render tests (9 files, 55 tests)
```

Design spec: [`docs/spec.md`](./docs/spec.md) · Implementation plan: [`docs/plan.md`](./docs/plan.md) · Task tracker: [`TASKS.md`](./TASKS.md)

## Testing

- `calc/` and `lib/` are covered by unit tests (formulas, edge cases, verdict classification)
- Feature components (`ForwardCalculator`, `ReverseCalculator`, `App`) are covered by render tests using the same calc functions
- `useLocalStorage` (persistence) and `useTheme` (dark/light toggle) are covered by hook tests

## License

[MIT](./LICENSE)
