# ChronoSphere

ChronoSphere is a local-first date utility for timezone-aware offsets, interval counting, DST auditing, and Chinese lunar calendar conversion.

Everything runs in the browser. No login, no uploads, no backend.

[中文版 README](./README.zh-CN.md)

Source: [StepaniaH/Toolbox](https://github.com/StepaniaH/Toolbox) — ChronoSphere lives at [`apps/chrono-sphere`](.) in this monorepo.

## Features
- Date offsets: calculate forward or backward offsets from a base date, with Gregorian and lunar results.
- Date intervals: compare two dates across timezones, track calendar-day difference, absolute elapsed time, and weekday / weekend counts.
- Timezone search and DST audit: search by country, city, or IANA timezone, then surface daylight-saving transitions in the selected range.
- Chinese lunar calendar: convert lunar year, month, day, and leap months, then show ganzhi, zodiac, solar terms, festivals, and almanac hints.
- Trilingual and theme-aware: Chinese (zh / zh-Hant) and English UI; dark/light mode and the palette family are chosen in the shared Settings app.

## Privacy
ChronoSphere does not send your dates, timezones, or lunar inputs to a backend. The browser only stores language and theme preferences.

## Deployment
ChronoSphere is built as part of the Toolbox monorepo: the root pipeline assembles every app into one static site served under `/chrono-sphere/`. See [docs/RELEASE.md](../../docs/RELEASE.md).

## Development
```bash
pnpm install
pnpm --filter=@toolbox/chrono-sphere dev
```

Production build:
```bash
pnpm --filter=@toolbox/chrono-sphere build
```

Preview the production build locally:
```bash
pnpm --filter=@toolbox/chrono-sphere preview
```

## License
MIT License. See [LICENSE](LICENSE).
