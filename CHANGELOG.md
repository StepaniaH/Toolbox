# Changelog

## Unreleased

### Privacy

- RateLens now uses a local reference exchange rate by default. Live USD/CNY data is fetched only after an explicit user action, with an on-screen third-party disclosure, timeout, fallback, and manual override.

### Architecture and documentation

- Defined the application-isolation and versioned-platform-contract direction.
- Added the shared design-system contract and new-tool development playbook.
- Rebuilt the live task board around post-v0.1 priorities and privacy-safe progress records.

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
