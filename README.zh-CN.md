# Toolbox

> 别人略过的，工具都算上了。

一个隐私优先的网页工具集合。核心计算在浏览器本地完成——无自有后端、无追踪、无 Cookie。

> 隐私说明：工具不会上传表单输入。RateLens 会自动向已披露的公开服务请求当前 USD/CNY 汇率；两个来源都失败时要求手动填写，不用硬编码汇率代替。

**线上**: [toolbox.stepaniah.me](https://toolbox.stepaniah.me) · **源码**: [github.com/StepaniaH/Toolbox](https://github.com/StepaniaH/Toolbox)

---

## 工具目录

| 工具 | 路径 | 说明 | 技术栈 |
|------|------|------|--------|
| 首页 | `/` | 导航枢纽 | HTML + CSS + Vanilla JS |
| RateLens | `/rate-lens/` | AI 模型价格倍率计算器 | React + TS + Vite + Tailwind |
| ChronoSphere | `/chrono-sphere/` | 日期与时区工具 | React + TS + Vite |
| Monitor Choice | `/monitor-choice/` | 显示器参数实验室 | HTML + Vanilla JS (Canvas) |
| SaneUnits | `/sane-units/` | 单位换算与现实估算 | React + TS + Vite |
| FormTran | `/image-converter/` | 本地文件、图片、表格、PDF 与 ZIP 工作台 | React + TS + Vite |
| CryptoLab | `/crypto-lab/` | 本地密码学、JWT 检查与公钥二维码安全分享 | React + TS + Vite |

---

## 设计原则

- **隐私优先** — 核心计算留在客户端；无自有后端、无追踪、无 Cookie；外部数据访问必须可见、可选并有本地 fallback。
- **双语** — 每个工具均提供中文 / 英文界面。
- **Catppuccin 主题** — Frappé（深色）+ Latte（浅色）；共享主题契约正在逐个工具落地。
- **MIT 开源** — 所有工具均采用 MIT 许可证。
- **静态部署** — 以静态文件形式由 Caddy 提供服务，统一域名下路径路由。

---

## 快速开始

```bash
pnpm install && pnpm dev
```

单个工具：

```bash
pnpm --filter=@toolbox/rate-lens dev   # 启动单个工具
pnpm build                              # 构建所有工具
pnpm test                               # 测试所有工具
```

完整项目概览见 [`docs/INDEX.md`](./docs/INDEX.md)，架构方向见 [`docs/PLAN.md`](./docs/PLAN.md)，固定发布与回滚流程见 [`docs/RELEASE.md`](./docs/RELEASE.md)，新增工具流程见 [`docs/NEW_TOOL.md`](./docs/NEW_TOOL.md)，开发规范见 [`docs/AGENTS.md`](./docs/AGENTS.md)。

新增工具时，维护者只需正常描述产品需求。Agent 必须自动调用仓库内
[`$develop-toolbox-tool`](./.agents/skills/develop-toolbox-tool/SKILL.md)，从 `dev` 创建本地
`newdev/<tool-id>`，自行补齐 Brief、平台接入、双语文档、隐私与测试。候选分支默认不推送；
审核模型在明确授权后本地合并到 `dev`，再按要求只推送 `dev`。

---

## 许可证

MIT
