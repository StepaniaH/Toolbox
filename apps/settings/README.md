# Settings

## Brief

```yaml
id: settings
route: /settings/
problem: (describe the user problem this tool solves)
inputs: (what the user provides)
outputs: (what the tool returns)
assumptions: (assumptions that change results)
privacy: pure client-side; no network requests; no account or backend
offline_fallback: fully offline by default
non_goals: (what this first version deliberately does not do)
acceptance:
  - (verifiable result 1)
  - (verifiable result 2)
```

## Usage

(Fill in after the first working screen.)

## Privacy

All computation stays in the browser. The app issues no external requests,
stores private state only under `toolbox.settings.*`, and reads only the shared
`toolbox-theme` / `toolbox-lang` preference keys.

## Development

```bash
pnpm install
pnpm --filter=@toolbox/settings dev
pnpm --filter=@toolbox/settings build
pnpm --filter=@toolbox/settings test
pnpm --filter=@toolbox/settings test:browser
pnpm --filter=@toolbox/settings lint
```
