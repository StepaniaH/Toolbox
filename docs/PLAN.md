# Toolbox — 发展方向与架构决策

> 本文档记录整体架构决策、设计原则、以及未来路线图。
> 可执行任务见 [TASKS.md](./TASKS.md)，AI agent 操作规范见 [AGENTS.md](./AGENTS.md)。

---

## 一、架构决策记录 (ADR)

### ADR-1: Monorepo 而非多仓库

**决策**: 合并到单一仓库 `StepaniaH/Toolbox`。

**理由**:
- 零用户零 star，无沉没成本
- 共享主题、导航栏、i18n 天然统一
- 新工具从 `apps/_template/` 复制即用，不重复配基建
- DNS 管理简化为一个域名
- 一份 AGENTS.md 即可规范所有 agent 操作

**代价**: 旧仓库需 archive，单工具开发者可能困惑（README 开头说明即可）。

### ADR-2: 路径路由而非子域名

**决策**: 统一域名 `tools.s-ark.xyz/<app>/`，不再为每个工具分配子域名。

**理由**:
- Caddy 仅需一个站点块，新工具无需改配置
- 导航栏用相对路径跳转，无跨域问题
- GA/AdSense 验证文件放根目录即覆盖所有页面
- 新增工具不需要新增 DNS 记录

## 部署架构（实际配置）

```
GitHub (StepaniaH/Toolbox)
  → pnpm build（本地或 CI）
    → rsync apps/homepage/ + apps/monitor-choice/ + apps/*/dist/
      → VPS: {{VPS_WWW}}/
        → Docker Caddy 容器: /srv/www/toolbox/
          → tools.s-ark.xyz (Caddy 自动 HTTPS)
```

| 环节 | 详情 |
|------|------|
| VPS | SaltyFish Frankfurt VPS ({{VPS_IP}}), 15GB SSD (9.7GB 可用) |
| Caddy | Docker 容器 `caddy:latest`, 宿主机 `~/www` 映射到容器 `/srv/www` |
| 配置文件 | `{{CADDY_DIR}}/Caddyfile` |
| 重载命令 | `docker compose -f ~/docker_projects/caddy/docker-compose.yml restart` |
| 部署方式 | 本地构建 → `rsync` 上传 → Caddy 提供静态文件 |
| 路由方式 | 路径路由: `tools.s-ark.xyz/<app>/`（一个站点块，无需配 DNS） |

**旧域名迁移**: 新站点上线后，保留旧子域名运行一段时间作为回退。最终删除旧 DNS 记录和 Caddy 站点块。不使用 301 跳转。

### ADR-3: 分三类应用处理

| 类型 | 示例 | 构建 | 部署 |
|------|------|------|------|
| **React (Vite)** | rate-lens, chrono-sphere, sane-units | `vite build --base=/<app>/` | rsync dist/ |
| **纯静态** | homepage, monitor-choice | 无（文件即产物） | 直接 rsync |
| **未来: 轻量框架** | 待定 | 按需 | 按需 |

### ADR-4: 共享包分层

```
packages/
├── theme/     ← 稳定层（CSS 变量 + 切换逻辑，变更极少）
└── nav/       ← 稳定层（导航栏组件，工具新增时更新链接列表）
```

- Agent 默认**不允许修改** `packages/` 下的文件，除非用户明确要求
- 新工具引用共享包，不复制代码

### ADR-5: 部署配置不入公开仓

**决策**: 公开仓库仅放 `.example` 模板，真实域名路径仅在 VPS 上。

```
deploy/
├── Caddyfile.example   ← 含占位符的模板，可安全公开
└── deploy.sh           ← 构建 + rsync 脚本（不含敏感信息）
```

### ADR-6: 旧域名过渡期

| 阶段 | 旧域名行为 | 新域名 |
|------|-----------|--------|
| 上线初期 | 旧域名正常运行 | tools.s-ark.xyz 同时上线 |
| 验证期 (~1周) | 保留作为回退 | 作为主站 |
| 迁移完成 | 删除旧 DNS 记录 + Caddy 站点块 | 唯一入口 |

不使用 301 跳转——直接清除旧记录。

---

## 二、设计系统

### 色彩

采用 [Catppuccin](https://catppuccin.com/) 配色，通过 `@toolbox/theme` 统一分发。

| 模式 | 风格 | 默认 |
|------|------|:--:|
| Dark | Catppuccin Frappe | ✅ 默认 |
| Light | Catppuccin Latte | |

### 导航栏

每个工具页顶部统一的导航条：

```
[🧰 Toolbox ▾]  RateLens  ChronoSphere  Monitor Choice  SaneUnits  [🌓]
```

- 悬停「Toolbox」展开下拉列表（所有工具 + 简介）
- 亮暗切换按钮统一在右上角
- 移动端折叠为汉堡菜单

### 字体

- 中文字体栈: `"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`
- 等宽字体: `"JetBrains Mono", "SF Mono", "Cascadia Code", monospace`
- 系统字体优先，零外部加载

### 响应式断点（新工具建议遵循）

| 断点 | 目标设备 |
|------|----------|
| 375px | 手机竖屏（最小支持宽度） |
| 768px | 平板竖屏 |
| 1024px | 平板横屏 / 小笔记本 |
| 1440px | 桌面显示器 |

---

## 三、工具开发规范

### 新增工具 Checklist

1. `cp -r apps/_template apps/new-tool`
2. 修改 `apps/new-tool/package.json` 中的 `name` 为 `@toolbox/new-tool`
3. 引用 `@toolbox/theme`（主题）和 `@toolbox/nav`（导航栏）
4. 在 `turbo.json` 中添加构建任务
5. 在 `apps/homepage/js/tools.js` 中添加导航卡片
6. 在 `packages/nav/` 的链接列表中追加新工具
7. 写 README.md + README.zh-CN.md
8. `pnpm --filter=new-tool dev` 验证开发环境
9. `pnpm build` 验证全量构建通过
10. `pnpm deploy` 部署到 VPS

### 每个工具必须包含

| 文件 | 说明 |
|------|------|
| `README.md` | 英文说明（功能、技术栈、如何本地运行） |
| `README.zh-CN.md` | 中文说明 |
| `package.json` | 含正确的 `name`、`scripts`（React 项目） |
| 中英双语界面 | 通过 i18n 实现 |

### 代码红线（AI agent 不得违反）

- ❌ 不得引入后端依赖（数据库、API 服务端、需要登录的功能）
- ❌ 不得引入第三方追踪/分析脚本（除非用户明确要求）
- ❌ 不得修改 `packages/` 下的文件（除非用户明确要求）
- ❌ 不得在未告知的情况下修改其他工具的代码
- ✅ 所有计算逻辑必须能在浏览器离线运行

---

## 四、测试策略

| 层级 | 工具 | 当前 | 目标 |
|------|------|:--:|:--:|
| 纯函数单元测试 | 所有 | 部分 | 核心计算逻辑全覆盖 |
| 组件渲染测试 | React 工具 | rate-lens 有 | 至少冒烟测试 |
| 端到端测试 | 所有 | 无 | 暂不需要（纯静态工具） |

---

## 五、未来路线图

### 短期（迁移完成后）

- [ ] 统一 i18n 框架（抽取到 `packages/i18n/`）
- [ ] 导航栏增强：悬停下拉显示所有工具简介
- [ ] 每个工具加入 `404.html`
- [ ] 响应式图片 + 暗色模式 favicon

### 中期

- [ ] PWA / Service Worker（离线可用）
- [ ] 共享组件库 `packages/ui/`（按钮、输入框、卡片等）
- [ ] 统一埋点（GA 或隐私友好的自建方案）
- [ ] 旧域名 301 跳转

### 长期

- [ ] 工具间数据互通（如 RateLens 的价格数据自动同步到其他工具）
- [ ] 广告接入（AdSense / 赞助链接）
- [ ] 用户反馈系统（GitHub Issues 集成）

---

## 六、已知技术债务

| # | 项目 | 问题 | 优先级 |
|---|------|------|:--:|
| 1 | monitor-choice | 零测试覆盖（6,475 行） | 🔴 |
| 2 | 全部 | i18n 实现碎片化（3 种不同方案） | 🟡 |
| 3 | rate-lens | 无英文 i18n | 🟡 |
| 4 | rate-lens | 模型定价数据硬编码，需手动更新 | 🟡 |
| 5 | chrono-sphere | 测试覆盖偏低（2 测试文件 / 4,263 行） | 🟡 |
| 6 | sane-units | 使用 Node --test 而非 Vitest，与生态不一致 | 🟢 |
| 7 | 全部 | 亮暗主题切换按钮位置/图标不统一 | 🟢 |
