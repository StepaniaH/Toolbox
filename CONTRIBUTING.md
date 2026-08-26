# Contributing

Thanks for your interest in improving Toolbox. This is a maintainer-driven
project, but focused bug reports, fixes, and new tool proposals are welcome.

## Ground rules

- **Privacy-first**: no first-party backend, no tracking, no telemetry, no
  remote fonts, and no external requests beyond the disclosed RateLens rate
  lookup. Any new network call will be rejected unless it follows the exception
  process in [`docs/AGENTS.md`](./docs/AGENTS.md).
- **Trilingual**: user-facing strings must exist in zh, zh-Hant, and en.
  zh-Hant catalogs are generated — see `packages/i18n/README.md`.
- **Tested**: logic changes need tests; visual changes must pass the app's
  browser smoke across themes, languages, and viewports.

## Workflow

The repository has a single remote branch, `main` (stable). Day-to-day
development happens on a local `dev` branch that is never pushed.

1. Fork the repository and branch from `main`.
2. Install dependencies: `pnpm install` (Node 24+, pnpm via corepack).
3. Develop with `pnpm --filter=@toolbox/<app> dev`; each tool lives in
   isolation under `apps/<tool>/`. See [`docs/NEW_TOOL.md`](./docs/NEW_TOOL.md)
   before proposing a new tool.
4. Run the gates that match your change:
   - single app: `pnpm --filter=@toolbox/<app> build && pnpm --filter=@toolbox/<app> test && pnpm --filter=@toolbox/<app> lint`
   - shared packages or cross-app changes: also `pnpm check:privacy`,
     `pnpm check:contracts`, `pnpm test`, `pnpm lint`
5. Open a pull request against `main` with a short description of the behavior
   change and the checks you ran. Keep diffs focused; one logical change per PR.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `docs:`, ...).

## Reporting bugs

Open a GitHub issue with the tool name, steps to reproduce, expected vs actual
behavior, and your browser/OS. For security issues, follow
[`SECURITY.md`](./SECURITY.md) instead of filing a public issue.

## Licensing

By contributing you agree that your contributions are licensed under the
[MIT License](./LICENSE).
