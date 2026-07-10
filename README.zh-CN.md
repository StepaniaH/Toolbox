# Toolbox

> 别人略过的，工具都算上了。

一个隐私优先的网页工具集合。所有运算在浏览器本地完成——零后端、零追踪、零 Cookie。

**线上**: [tools.s-ark.xyz](https://tools.s-ark.xyz) · **源码**: [github.com/StepaniaH/Toolbox](https://github.com/StepaniaH/Toolbox)

---

## 工具目录

| 工具 | 路径 | 说明 | 技术栈 |
|------|------|------|--------|
| 首页 | `/` | 导航枢纽 | HTML + CSS + Vanilla JS |
| RateLens | `/rate-lens/` | AI 模型价格倍率计算器 | React + TS + Vite + Tailwind |
| ChronoSphere | `/chrono-sphere/` | 日期与时区工具 | React + TS + Vite |
| Monitor Choice | `/monitor-choice/` | 显示器参数实验室 | HTML + Vanilla JS (Canvas) |
| SaneUnits | `/sane-units/` | 单位换算与现实估算 | React + Vite |

---

## 设计原则

- **隐私优先** — 全客户端运算；无后端、无追踪、无 Cookie、无第三方脚本。
- **双语** — 每个工具均提供中文 / 英文界面。
- **Catppuccin 主题** — Frappé（深色·默认）+ Latte（浅色），通过共享主题包统一。
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

完整项目概览见 [`docs/INDEX.md`](./docs/INDEX.md)，开发规范见 [`docs/AGENTS.md`](./docs/AGENTS.md)。

---

## 许可证

MIT
