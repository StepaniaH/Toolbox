# Toolbox — 全景索引

> 最后更新: 2026-07-09
> 这是 Toolbox monorepo 的入口文档。合并自 5 个独立仓库的 passion projects。
>
> **线上**: [tools.s-ark.xyz](https://tools.s-ark.xyz)（部署中）  
> **源码**: [github.com/StepaniaH/Toolbox](https://github.com/StepaniaH/Toolbox)

---

## 一、这是什么

**Toolbox** 是一个隐私优先的网页工具集合。每个工具做一件事，算清楚。所有运算在浏览器本地完成——零后端、零追踪、零 Cookie。

**标语**: 「别人略过的，工具都算上了。」

---

## 二、工具目录

| 工具 | 路径 | 技术栈 | 状态 |
|------|------|--------|:--:|
| **首页** | `/` | HTML + CSS + Vanilla JS | ✅ |
| **RateLens** | `/rate-lens/` | React 19 + TS + Vite + Tailwind + shadcn/ui | ✅ v1.0.0 |
| **ChronoSphere** | `/chrono-sphere/` | React 19 + TS + Vite + luxon + lunar-javascript | ✅ |
| **Monitor Choice** | `/monitor-choice/` | HTML + CSS + Vanilla JS (Canvas 2D) | ✅ |
| **SaneUnits** | `/sane-units/` | React 19 + Vite + Plain CSS | ✅ |

### RateLens · AI 模型价格倍率计算器

AI API 中转服务的定价透明工具。支持正算（充值→等效倍率）和反推（扣费→真实倍率）。

### ChronoSphere · 日期与时区工具

时区偏移推算、日期间隔计算（明确起止端点）、夏令时审计、中国农历转换。

### Monitor Choice · 显示器选购工具

PPI 清晰度、3D 观看距离、CIE 色度图、面板技术百科——帮你做出自己的选择。

### SaneUnits · 单位换算与现实估算

存储进制混淆、网络带宽换算、视频码率推算、电器功耗估算——不糊弄人。

---

## 三、设计哲学

| 原则 | 说明 |
|------|------|
| **隐私优先** | 全客户端运算，零后端、零追踪、零 Cookie、零第三方脚本 |
| **双语** | 每个工具均有中文 / 英文界面 |
| **Catppuccin 主题** | Frappe（深色·默认）+ Latte（浅色），通过共享主题包统一 |
| **MIT 开源** | 所有工具 MIT 许可证 |
| **路径路由** | 统一域名 `tools.s-ark.xyz/<工具名>/`，一个 Caddy 站点块 |

---

## 四、仓库结构

```
Toolbox/
├── apps/                       # 各工具应用（独立 Vite 项目或静态文件）
│   ├── homepage/               # 导航首页（纯静态 HTML）
│   ├── rate-lens/              # React + TS + Tailwind
│   ├── chrono-sphere/          # React + TS
│   ├── monitor-choice/         # Vanilla JS + Canvas（纯静态）
│   └── sane-units/             # React + JS
│
├── packages/                   # 共享包（workspace 依赖）
│   ├── theme/                  # Catppuccin CSS 变量 + 亮暗切换逻辑
│   └── nav/                    # 全局导航栏（React 组件 + 纯 HTML 版）
│
├── deploy/                     # 部署相关
│   ├── Caddyfile.example       # Caddy 配置模板
│   └── deploy.sh               # 部署脚本
│
├── docs/                       # 仓库级文档
│   ├── INDEX.md                # ← 本文档
│   ├── PLAN.md                 # 发展方向与架构决策
│   ├── TASKS.md                # 可执行任务列表（给 code agent 看）
│   └── AGENTS.md               # AI agent 操作规范
│
├── package.json                # workspace 根配置
├── turbo.json                  # Turborepo 流水线
├── pnpm-workspace.yaml         # pnpm workspace 定义
├── .env.example                # 环境变量模板
├── .gitignore
├── README.md
├── README.zh-CN.md
└── LICENSE
```

---

## 五、技术栈

| 层级 | 选择 | 说明 |
|------|------|------|
| **包管理** | pnpm | workspace 原生支持，严格依赖隔离 |
| **构建编排** | Turborepo | 缓存构建结果，并行执行 |
| **React 应用** | Vite + React 19 + TypeScript | rate-lens, chrono-sphere, sane-units |
| **静态应用** | HTML + CSS + Vanilla JS | homepage, monitor-choice |
| **主题** | Catppuccin + `@toolbox/theme` | 统一 CSS 变量 + 切换逻辑 |
| **导航** | `@toolbox/nav` | 工具间跳转的下拉导航栏 |
| **测试** | Vitest | 统一测试框架 |
| **部署** | Caddy 静态文件 | 路径路由，一个站点块 |

---

## 六、本地开发

```bash
# 安装依赖
pnpm install

# 启动所有应用
pnpm dev

# 启动单个应用
pnpm --filter=rate-lens dev

# 构建所有应用
pnpm build

# 测试所有应用
pnpm test
```

---

## 七、部署架构

```
GitHub (StepaniaH/Toolbox)
  → pnpm build（本地或 CI）
    → rsync apps/*/dist/ → VPS (SaltyFish Frankfurt)
      → tools.s-ark.xyz (Caddy 静态文件 + 自动 HTTPS)
```

**旧域名迁移策略**: 新站点 `tools.s-ark.xyz` 上线后，保留旧子域名（`ratelens.s-ark.xyz` 等）运行一段时间。确认无问题后，添加 301 永久重定向到新路径。

---

## 八、各工具详细文档

每个工具的详细说明（功能、架构、已知问题）见各自目录下的 README.md。
跨项目任务见 [TASKS.md](./docs/TASKS.md)。
架构决策见 [PLAN.md](./docs/PLAN.md)。
