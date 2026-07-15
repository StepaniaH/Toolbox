# Changelog

## Unreleased

## v0.3.1 (2026-07-15)

### Added

- Promoted CryptoLab from a hidden candidate to the stable `dev` catalog, Homepage, and shared
  navigation with bilingual public-facing descriptions.
- Added a SHA-256 public-key fingerprint to Secure Share and RSA workflows, plus a one-click action
  that clears all sensitive CryptoLab state held by the current page.

### Changed

- Separated RSA-OAEP encryption from RSA-PSS signing, gave signatures their own field, and kept
  private keys and JWT verification secrets concealed until the user chooses to reveal them.
- Preserved visited CryptoLab workspaces while switching tabs, while keeping task reset and page
  refresh as explicit local-data boundaries.
- Distinguished decoded JWT content from cryptographically verified content and added local
  `exp`, `nbf`, and `iat` NumericDate inspection against the device clock.

### Security and quality

- Enforced RSA-OAEP plaintext budgets before encryption, bounded PEM and JWT inputs, tightened PEM
  and Base64Url parsing, and invalidated dependent output whenever its source input changes.
- Verified seven production builds, 1,148 tests, all seven browser suites, zero-warning lint,
  privacy checks, and application contracts before pushing the `dev` candidate.

## v0.3.0 (2026-07-14)

### Added

- Added CryptoLab as a hidden `dev` candidate with local encoding, hashing, HMAC, symmetric and
  asymmetric cryptography, JWT inspection, a security-focused About page, and bilingual guidance.
- Added CryptoLab Secure Share: RSA-OAEP-SHA-256 wraps a random AES-256-GCM key in a versioned QR
  packet, while the private key remains outside the QR code, URL, storage, and network.
- Added a separate FormTran table-data workspace for bounded CSV/TSV/XLSX parsing, preview, and
  value-oriented export to CSV, TSV, JSON, or macro-free XLSX.
- Added local HEIC/HEIF input to FormTran with a native-browser path and an on-demand WASM fallback.
- Added a shared FormTran result desk for individual, selected, same-family, or whole-task naming,
  preview, removal, direct download, and family-grouped ZIP export.
- Advanced FormTran PDF handling from lightweight inspection to bounded full parsing, queue-order
  merge, per-page split, extract, remove, complete reorder, and selected-page rotation.

### Changed

- Kept spreadsheet conversion separate from ordinary archive extraction: XLSX follows workbook
  relationships, ignores external links, never runs formulas or macros, and reads cached values only.
- Reduced repeated ZIP reads by sharing one bounded archive buffer, and kept the HEIC decoder out of
  FormTran's initial bundle so it loads only when an Apple image format requires it.
- Extended FormTran's flatter section, list, and table hierarchy instead of adding a wall of cards.
- Reorganized FormTran PDF work into queue, document-detail, and page-task levels with page presets,
  live result ordering, aligned controls, and one task reset shared by Home and routed workspaces.
- Unified the CryptoLab and FormTran responsive visual hierarchy; CryptoLab tabs no longer expose a
  stray vertical scrollbar, while both tools retain the shared bilingual shell without card-heavy UI.

### Security and quality

- CSV/TSV export protects against spreadsheet formula injection by default; table size, row, column,
  cell, XML-entry, HEIC byte, canvas-side, and pixel budgets are enforced before expensive work.
- Production-browser coverage exercises real CSV→XLSX→re-import and HEIC→PNG flows in addition to
  focused parser, crypto, privacy, contract, build, lint, and shell regressions.
- Updated checkout, Node setup, and pnpm setup Actions to official Node 24-compatible releases pinned
  by immutable commit SHA; CI remains read-only and production deployment remains manual from `main`.
- Verified seven production builds, 1,138 tests, all seven browser suites, zero-warning lint, privacy
  and application contracts, and a production dependency audit with no known vulnerabilities.

## v0.2.6 (2026-07-13)

### Added

- Added local batch rotation at 0°/90°/180°/270° plus horizontal and vertical flipping to
  FormTran's image workspace.
- Added pre-conversion image details for safely previewable raster inputs, including decoded
  dimensions, pixel count, aspect ratio, browser MIME type, and file size.

### Changed

- Reworked FormTran's light-theme surface mapping so tabs, cards, inputs, secondary actions,
  notices, and popovers use a brighter hierarchy without changing the shared theme contract.
- Promoted Rotate & Flip from FormTran's planned file-home actions to an available local tool.

### Security and quality

- Invalid persisted transform values recover to safe defaults, requested transforms always
  re-encode instead of returning an unchanged original, and production-browser coverage checks
  a real non-square rotation plus the light-surface regression.
- Verified six production builds, 1,013 tests, zero-warning lint, privacy and application
  contracts, and all six production browser suites before pushing the `dev` candidate.

## v0.2.5 (2026-07-13)

### Added

- Added FormTran, a browser-local file workspace for file identification, image conversion,
  GIF composition, text/markup conversion, lightweight PDF inspection, and bounded ZIP
  listing and extraction.
- Added FormTran to the canonical navigation, Homepage catalog, and verified production
  deployment list.

### Changed

- Unified file-selection controls across FormTran's file home, image, GIF, text, PDF, and
  archive workspaces, including geometry, focus behavior, icons, and accessible names.
- Refined FormTran's bilingual subtitle to emphasize that every processing step stays on the
  user's device.
- Updated the default Vite 6 line from 6.4.2 to the 6.4.3 security patch.

### Security and quality

- Hardened Markdown links, SVG references, ZIP path/header/size/CRC handling, bounded Deflate
  extraction, and persisted-setting recovery for malformed local values.
- Verified six production builds, 1,012 tests, zero-warning lint, privacy and application
  contracts, six browser smoke suites, and a production dependency audit with no known
  vulnerabilities before promotion.

## v0.2.4 (2026-07-12)

### Fixed

- Removed the repeated SaneUnits application icon from the storage, network, video, power,
  and about subpage headings while preserving the single canonical icon beside the main
  SaneUnits title.

### Changed

- Made the Toolbox brand a direct home link with a separate accessible tool-menu trigger;
  brand, language, and theme hover states now use color without a background selection box.
- Added localized in-menu tool search backed by canonical manifest names, descriptions, and
  Chinese/English keywords, including a localized empty state.
- Replaced Monitor Choice's many live backdrop-blur surfaces with opaque Catppuccin surfaces
  to reduce GPU compositing work during scrolling and Canvas updates.
- Rebuilt the new-tool workflow around isolated `newdev/<tool-id>` branches, a repository
  development skill, explicit handoff cleanup, privacy rules, and single-tool preview commands.

### Quality

- Root browser tests now discover every workspace that provides `test:browser`; new tools no
  longer require a hard-coded root script update.
- Contract checks now require the full app script surface and localized search keywords.
- Added production-browser coverage for Toolbox search and SaneUnits' single-icon hierarchy,
  plus a build regression check that prevents Monitor Choice backdrop filters returning.
- Removed obsolete pre-monorepo RateLens planning documents and one-time SaneUnits prototype
  instructions; retained all active tests.

## v0.2.3 (2026-07-12)

### Fixed

- Synchronized `<html lang>` from the shared i18n core on initialization and every language change, fixing RateLens declaring Chinese metadata while rendering English.

### Changed

- Language choices now keep their native names (`中文（简体）`, `English`) in both React and Vanilla navigation, so users can always recognize the language they want to switch to.

### Quality

- Expanded the shared browser contract so all five applications traverse all four language/theme combinations at both 1440px and 390px, then restore their initial preferences.
- Kept one representative business surface mounted and overflow-free through every combination: Homepage cards, Monitor Choice sharpness, RateLens calculator, ChronoSphere interval results and SaneUnits storage.
- Made the ChronoSphere interval browser fixture deterministic with a fixed Asia/Shanghai timezone and fixed date range, while RateLens continues to mock both successful and failed exchange-rate responses.

## v0.2.2 (2026-07-12)

### Fixed

- Removed ChronoSphere's refresh-time tab-strip repaint seam by taking the tabs out of the fixed-background, backdrop-filter and retained-transform compositing path; the production browser smoke now guards that stable rendering contract.
- Restored the shared NavBar's centered 1280px content axis after v0.2.1 incorrectly pinned most Toolbox brands to the viewport edge.

### Changed

- Rebuilt SaneUnits around the same vertical page rhythm as the other tools: app identity, one horizontal calculator navigation, centered page content and the shared footer. The permanent desktop sidebar and separate mobile header are gone, while all calculator routes remain available.
- Standardized RateLens, ChronoSphere, Monitor Choice and SaneUnits title marks on ChronoSphere's quiet 40px, 12px-radius, single-accent surface while preserving each tool's own icon.

### Quality

- Added one shared production-browser geometry contract across all five applications for the centered 1440px NavBar axis, the 390px single tool entry, responsive footer direction and document overflow.

## v0.2.1 (2026-07-12)

### Fixed

- Corrected ChronoSphere's Chinese absolute-time result from the malformed “天 11 小时 0” order to “11 天 0 小时”, with translation and production-browser regression coverage.
- Removed the duplicate mobile tool directory; the left Toolbox menu is now the single tool switcher at every viewport.

### Changed

- Replaced the binary language toggle with an extensible language-icon menu that marks the current language, and replaced the rotating `🌓` emoji with state-aware sun/moon icons.
- Slightly increased the shared navigation typography and aligned the Toolbox brand to the true left edge of the application shell.
- Added canonical application icons to the manifest so Homepage cards and in-tool titles use the same mark.
- Unified all five footers around an app-specific one-line description and shared GitHub, MIT and release metadata.
- Aligned ChronoSphere, Monitor Choice and SaneUnits title hierarchy with RateLens; reduced SaneUnits business-card glow and corrected its sidebar/nav geometry.

## v0.2 (2026-07-11)

### Release highlights

- Rebuilt the five-tool repository around one pnpm/Turborepo workspace, a canonical app manifest, shared platform contracts, and enforceable app-isolation/privacy checks.
- Restored Monitor Choice's production styling, separated and tested its calculations, added browser coverage for every tab/canvas, and supplied accessible text summaries.
- Consolidated theme, language, navigation and storage contracts across all tools; SaneUnits now has a single global preference surface, shared semantic tokens, and route/mobile browser coverage.
- Replaced merge-triggered production deployment with an explicit manual main workflow, immutable Action SHAs, documented rollback steps, and a hardened local fallback script.
- Changed RateLens to transparently request the current USD/CNY rate on page load; it sends no calculator inputs and requires manual entry instead of using a hardcoded value when both public endpoints fail.

### Privacy

- RateLens automatically requests the current USD/CNY rate from the disclosed public service, with a fixed-endpoint fallback and timeout. No calculator inputs are sent; if both services fail, no hardcoded rate is substituted and the user is asked to enter one manually.
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
- Replaced SaneUnits' copied dark/light palette with the shared theme stylesheet and semantic background, text, border, state, typography, and radius tokens.
- Added a SaneUnits production browser smoke covering all five calculator/about routes, shared language/theme switching, semantic style tokens, duplicate-control absence, and the 390px layout; language changes now also keep `<html lang>` accurate.
- Added deterministic RateLens production browser coverage for automatic live-rate success, dual-source failure, required manual entry, disclosure copy, mobile layout, and console errors.
- Changed production release to an explicit manual GitHub Actions step after main CI, pinned every Action to an immutable official commit SHA, and documented the fixed dev-to-main deployment and rollback flow.

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
