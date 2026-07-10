# ChronoSphere

ChronoSphere is a local-first date utility for timezone-aware offsets, interval counting, DST auditing, and Chinese lunar calendar conversion.

Everything runs in the browser. No login, no uploads, no backend.

[中文版 README](./README.zh-CN.md)

Source: [StepaniaH/chrono-sphere](https://github.com/StepaniaH/chrono-sphere)

## Features
- Date offsets: calculate forward or backward offsets from a base date, with Gregorian and lunar results.
- Date intervals: compare two dates across timezones, track calendar-day difference, absolute elapsed time, and weekday / weekend counts.
- Timezone search and DST audit: search by country, city, or IANA timezone, then surface daylight-saving transitions in the selected range.
- Chinese lunar calendar: convert lunar year, month, day, and leap months, then show ganzhi, zodiac, solar terms, festivals, and almanac hints.
- Bilingual and theme-aware: supports Chinese and English, plus light, dark, and system themes.

## Privacy
ChronoSphere does not send your dates, timezones, or lunar inputs to a backend. The browser only stores language and theme preferences.

## Deployment
This is a static site. Deploy `dist/` to Caddy, Nginx, or any static host. If you use SPA routing, rewrite unknown paths to `index.html`.

## Development
```bash
npm install
npm run dev
```

Production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

## License
MIT License. See [LICENSE](LICENSE).
