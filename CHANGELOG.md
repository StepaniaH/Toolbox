# Changelog

## Unreleased

### Privacy

- RateLens now uses a local reference exchange rate by default. Live USD/CNY data is fetched only after an explicit user action, with an on-screen third-party disclosure, timeout, fallback, and manual override.
- Added a dependency-free privacy scanner that reports only finding categories and file paths, never matched values; CI now runs it before installing dependencies.
- CI uses read-only repository permissions, does not persist checkout credentials, and explicitly disables Turborepo telemetry.

### Deployment safety

- Manual deployment now refuses non-`main`, detached, dirty, diverged, or non-fast-forward states instead of silently switching branches.
- Sanitized `deploy/.env.example` to use placeholders only; host, port, and remote path remain exclusively in ignored local configuration or CI secrets.

### Architecture and documentation

- Defined the application-isolation and versioned-platform-contract direction.
- Added the shared design-system contract and new-tool development playbook.
- Rebuilt the live task board around post-v0.1 priorities and privacy-safe progress records.
- Unified NavBar language/theme actions: pointer hover no longer draws a background box, while keyboard focus gets a visible 2px ring.
- Added `pnpm check:contracts` to enforce app isolation, package/base/output conventions, approved runtime network origins, NavBar interaction rules, and byte-identical static deployment copies.
- Migrated Homepage into the workspace with a Vite build, root-path deployment artifact, smoke tests, and direct nav/theme/i18n package consumption; removed its copied platform runtimes.
- Migrated Monitor Choice into the workspace with an ordered Vite bootstrap, eight smoke/calculation tests, shared platform runtimes, hashed deployment assets, and zero lint warnings.
- Added the tested `@toolbox/app-manifest` catalog; Homepage and both Nav implementations now derive stable app identity, routes, labels, and descriptions from one public metadata source, with new entries hidden by default.
- Standardized theme persistence on `toolbox-theme` and private state on `toolbox.<app-id>.*`; existing RateLens, ChronoSphere, SaneUnits, and Monitor Choice keys remain readable through explicit migration fallbacks.
- Froze the `@toolbox/theme` v1 public contract for modes, storage, DOM state, semantic tokens, runtime fallback, and pre-paint behavior; package-level tests now guard it before app-by-app adoption.
- Moved ChronoSphere theme persistence, DOM state, defaults, and resolved-theme validation onto the shared v1 runtime contract while preserving its app-level system mode and existing visual tokens.
- Moved RateLens theme persistence, DOM state, defaults, and validation onto the same v1 runtime contract while preserving its legacy pre-paint fallback and Tailwind-specific visual tokens.
- Moved SaneUnits theme persistence and DOM state onto the v1 runtime contract; contract checks now require every app to directly consume theme, nav, and i18n platform packages.

### Dependency governance

- Removed app-level npm lockfiles; the root `pnpm-lock.yaml` is now the only dependency lock source.
- Contract checks reject new `package-lock.json` or `yarn.lock` files under `apps/`.
- Centralized React/Vite/Vitest/TypeScript toolchain versions in pnpm catalogs without changing resolved versions; named Vite 7/8 migration lines and a documented revert-first rollback procedure keep upgrades explicit.

### Quality

- Fixed RateLens exchange-rate preset labels leaking raw translation keys into the interface; rendering tests now cover both presets.
- Cleared the existing SaneUnits lint warnings without changing runtime behavior.
- Test storage mocks no longer trigger Node 26's file-backed `localStorage` getter, removing worker-level experimental warnings.
- ESLint and Oxlint now fail on warnings so the clean lint baseline cannot silently regress.
- Vanilla Nav now refreshes desktop and mobile tool labels when the shared language changes.
- Converted Monitor Choice display calculations to explicit ESM exports while retaining the existing global bridge; focused tests now cover PPI/PPD, dimensions, FOV, cinema distances, comfort scores, bandwidth, and desk constraints.
- Fixed Monitor Choice production builds leaving six source-relative CSS imports under the hashed asset directory; Vite now bundles all business styles, and a regression test rejects unresolved CSS imports.
- Added a Monitor Choice production browser smoke for failed resources, all five tabs, seven canvases, language/theme switching, and console errors; CI now installs Chromium and runs it.
- Added localized accessible names and dynamic text-result descriptions for all seven Monitor Choice canvases, so visual plots are not the only way to understand results.
- Removed SaneUnits' duplicate sidebar and mobile theme/language buttons; shared navigation is now the only global preference surface, enforced by the contract checker.

## v0.1 (2026-07-10)

### 首个稳定版本

5 个隐私优先工具合并为统一 monorepo：

- **Homepage** — 导航首页
- **RateLens** — AI 模型价格倍率计算器
- **ChronoSphere** — 日期与时区工具
- **Monitor Choice** — 显示器选购工具
- **SaneUnits** — 单位换算与现实估算

### 基础设施

- pnpm + Turborepo monorepo 架构
- 共享包：`@toolbox/theme`（主题）、`@toolbox/nav`（导航栏）、`@toolbox/i18n`（国际化）
- Vitest 测试框架，全量 910+ 测试通过
- GitHub Actions CI/CD：push → build → test → deploy
- Caddy 静态文件部署：`tools.s-ark.xyz`
