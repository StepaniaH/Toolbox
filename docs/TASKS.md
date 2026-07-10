# Toolbox — 任务列表

> 本文档为 code agent（如 OpenCode、Codex）提供可执行的任务指令。
> 每个任务包含：目标、涉及文件、执行命令、验证方式、依赖关系。
>
> **依赖图**:
> ```
> P0 → P1 → P2 → P3 → P3.5 → P4 → P5 → P6
>                              ↘ P7 (质量) ─┐
>                              ↘ P8 (共享) ─┤→ P9 (CI/CD)
>                                            ┘
> ```

---

## Phase 0: 准备与前置检查

### T0.1 · 确认所有源仓库状态 `⏱ 5min` `无依赖`

**目标**: 确保 5 个源仓库都在最新 main 分支，无未提交变更。

**操作**:
```bash
for p in rate-lens chrono-sphere sane-units monitor-choice tools-homepage; do
  cd {{PROJECTS_DIR}}/$p
  echo "=== $p ==="
  git branch --show-current          # 应为 main
  git status --porcelain             # 应为空（无输出）
  git fetch origin
  git log HEAD..origin/main --oneline # 应为空（本地最新）
done
```

**验证**: 所有项目 `git status --porcelain` 输出为空。

**当前状态**: ✅ 已验证通过（2026-07-09，全部分支 main，0 dirty files）。

---

### T0.2 · 获取 VPS 部署信息 `⏱ 5min` `✅ 已完成`

**VPS 配置（已获取，只读）**:

| 项目 | 值 |
|------|-----|
| 主机 | SaltyFish Frankfurt VPS ({{VPS_IP}}) |
| 磁盘 | 15GB 总量, 4.3GB 已用, 9.7GB 可用 (31%) |
| Caddy | Docker 容器 `caddy`, image `caddy:latest` |
| Caddy 配置 | `{{CADDY_DIR}}/Caddyfile` |
| Web 根目录（宿主机） | `~/www/` |
| Web 根目录（容器内） | `/srv/www/`（宿主机 `~/www` 映射到容器 `/srv/www`） |

**当前 Caddyfile 站点块**（与 Toolbox 相关的部分）:
```nginx
tool.s-ark.xyz         → root /srv/www/tools-homepage
chrono.s-ark.xyz       → root /srv/www/chrono-sphere
saneunits.s-ark.xyz    → root /srv/www/sane-units
monichoice.s-ark.xyz   → root /srv/www/monitor-choice
ratelens.s-ark.xyz     → root /srv/www/rate-lens
```

**当前 Web 目录结构**:
```
~/www/
├── chrono-sphere/     (index.html + assets/)
├── monitor-choice/    (index.html + css/ + js/)
├── rate-lens/         (index.html + assets/)
├── sane-units/        (index.html + assets/)
├── tools-homepage/    (index.html + css/ + js/)
└── tiny-cosmos/       (不相关，勿动)
```

**⚠️ 重要发现**:
- `tools.s-ark.xyz` DNS 当前指向 `{{MARIO_TAILSCALE_IP}}`（内部服务器），**需要改为 `{{VPS_IP}}`**（VPS）
- Caddy 重载命令: `docker compose -f {{CADDY_DIR}}/docker-compose.yml restart`

---

### T0.3 · 为 tools 添加独立 DNS 记录 `⏱ 2min` `需用户操作` `阻塞 T5.3`

**现状**: AdGuard Home 有 `*.s-ark.xyz → {{MARIO_TAILSCALE_IP}}`（内部服务器）泛域名规则，覆盖所有家庭内网服务。已有独立记录的子域名（`tool.` / `chrono.` / `ratelens.` 等）会覆盖泛域名，正确指向 VPS `{{VPS_IP}}`。

**问题**: `tools.s-ark.xyz` 尚未添加独立记录，走了泛域名规则指向内部服务器。

**操作**: 在 AdGuard Home（或上游 Cloudflare/Aliyun DNS）中添加一条 A 记录：
```
tools.s-ark.xyz → {{VPS_IP}}
```

**验证**: `dig tools.s-ark.xyz +short` 返回 `{{VPS_IP}}`

---

## Phase 1: Monorepo 骨架搭建

### T1.1 · 初始化 Git 仓库并创建目录结构 `⏱ 10min` `依赖: T0.1`

**目标**: 在 `{{PROJECTS_DIR}}/Toolbox/` 内初始化 git 仓库并创建 monorepo 目录骨架。

**操作**:
```bash
cd {{PROJECTS_DIR}}/Toolbox

# 初始化 git（GitHub 上已创建空仓库 StepaniaH/Toolbox.git）
git init
git remote add origin git@github.com:StepaniaH/Toolbox.git

# 创建目录结构（docs/ 已存在，补充其余的）
mkdir -p apps apps/homepage apps/rate-lens apps/chrono-sphere apps/monitor-choice apps/sane-units
mkdir -p apps/_template
mkdir -p packages/theme packages/nav
mkdir -p deploy

# 创建 .gitignore
cat > .gitignore << 'GITEOF'
node_modules/
dist/
.env
*.local
.DS_Store
.turbo/
deploy/.env
GITEOF
```

**验证**: `ls apps/` 显示 6 个目录（5 个工具 + _template）。

---

### T1.2 · 初始化 pnpm workspace `⏱ 10min` `依赖: T1.1`

**目标**: 配置 pnpm workspace 和根 package.json。

**操作**:
```bash
cd {{PROJECTS_DIR}}/Toolbox

# 确保 pnpm 已安装
which pnpm || npm install -g pnpm

# 根 package.json
cat > package.json << 'PKGEOF'
{
  "name": "toolbox",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "deploy": "bash deploy/deploy.sh",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
PKGEOF

# pnpm workspace 配置
cat > pnpm-workspace.yaml << 'PNPMEOF'
packages:
  - "apps/*"
  - "packages/*"
PNPMEOF

# Turborepo 配置
cat > turbo.json << 'TURBOEOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["packages/theme/**", "packages/nav/**"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
TURBOEOF

pnpm install
```

**验证**: 
- `pnpm install` 成功
- `ls node_modules/turbo` 存在
- `pnpm --version` 返回 >= 9.0

---

### T1.3 · 创建共享环境变量模板 `⏱ 5min` `依赖: T1.2`

**目标**: 创建 `.env.example` 作为环境变量参考。

**操作**:
```bash
cd {{PROJECTS_DIR}}/Toolbox

cat > .env.example << 'ENVEOF'
# ============================================
# Toolbox 环境变量模板
# 复制此文件为 .env 并填入实际值
# .env 不会被提交到 git
# ============================================

# 部署目标
# VPS 的 SSH 连接信息
DEPLOY_HOST=your-vps-host
DEPLOY_USER=your-ssh-user
DEPLOY_PATH=/var/www/toolbox

# 可选: Google Analytics 测量 ID
# GA_MEASUREMENT_ID=G-XXXXXXXXXX

# 可选: 构建时的 base URL（默认: 每个 app 自己的路径）
# VITE_BASE_URL=/
ENVEOF
```

**验证**: `.env.example` 已创建，被 `.gitignore` 排除的是 `.env` 而非 `.env.example`。

---

### T1.4 · 编写根 README `⏱ 15min` `依赖: T1.2`

**目标**: 创建仓库顶层的 README.md 和 README.zh-CN.md。

**操作**: 创建两个文件：

`README.md` — 英文主 README，包含：
- 项目一句话介绍
- 工具目录表格（名称、路径、简介、技术栈）
- 设计原则
- 本地开发指南（pnpm install → pnpm dev）
- 线上地址
- LICENSE

`README.zh-CN.md` — 中文版，内容对应。

**参考**: 使用 `INDEX.md` 中的内容和结构。

---

### T1.5 · 创建 AGENTS.md `⏱ 15min` `依赖: T1.2`

**目标**: 创建 AI agent 操作规范，放在 `docs/AGENTS.md`。

**操作**: 创建 `docs/AGENTS.md`，内容包含：

```markdown
# AGENTS.md — AI Agent 操作规范

## 仓库结构认知
- `apps/` — 各独立工具，agent 修改时只动目标工具
- `packages/` — 共享包，默认只读
- `docs/` — 文档

## 红线（不可违反）
1. 不引入后端/数据库/登录
2. 不引入第三方追踪（除非用户明确要求）
3. 不修改 packages/ 除非用户明确说「改 XX 共享包」
4. 不修改其他工具的代码
5. 新增工具必须引用 @toolbox/theme 和 @toolbox/nav

## 开发流程
1. 读 docs/INDEX.md 了解全局
2. 读目标工具的 README.md
3. 在 apps/<tool>/ 下操作
4. pnpm --filter=<tool> dev 验证
5. pnpm test 全量测试

## 新工具 Checklist
(从 apps/_template 复制开始，包含所有步骤)
```

**验证**: 文件存在且包含「红线」和「新工具 Checklist」两节。

---

## Phase 2: 迁移应用

### 通用迁移步骤（每个工具执行 T2.x.1 → T2.x.2 → T2.x.3）

对每个应用：

1. **T2.x.1 复制文件**: 将源仓库文件复制到 `apps/<name>/`，**排除 `.git/`、`node_modules/`、`dist/`**
2. **T2.x.2 调整配置**: 修改构建配置以适配 monorepo（base 路径、依赖引用）
3. **T2.x.3 验证**: 本地构建/运行通过

---

### T2.1 · 迁移 homepage（纯静态） `⏱ 15min` `依赖: T1.5`

**源**: `{{PROJECTS_DIR}}/tools-homepage/`  
**目标**: `apps/homepage/`

**T2.1.1 复制文件**:
```bash
SRC={{PROJECTS_DIR}}/tools-homepage
DEST={{PROJECTS_DIR}}/Toolbox/apps/homepage

cp -r $SRC/* $DEST/
# 移除不需要的文件
rm -rf $DEST/.git $DEST/README.md $DEST/README.zh-CN.md
# README 由工具自己维护（后面单独写）
```

**T2.1.2 调整**:
- 不需要构建工具，文件即产物
- 在 `apps/homepage/js/main.js` 中，将 `tools` 数组里的 URL 从绝对路径 `https://xxx.s-ark.xyz/` 改为相对路径 `/rate-lens/` 等形式
- 确认 `index.html` 中的 CSS/JS 引用使用相对路径

**T2.1.3 验证**:
```bash
cd apps/homepage && python3 -m http.server 8080
# 浏览器访问 http://localhost:8080，确认页面正常渲染
```

**注意**: homepage 目前卡片数组硬编码了 3 个工具。RateLens 卡片将在 Phase 4 统一添加。

---

### T2.2 · 迁移 rate-lens `⏱ 20min` `依赖: T1.5`

**源**: `{{PROJECTS_DIR}}/rate-lens/`  
**目标**: `apps/rate-lens/`

**T2.2.1 复制文件**:
```bash
SRC={{PROJECTS_DIR}}/rate-lens
DEST={{PROJECTS_DIR}}/Toolbox/apps/rate-lens

cp -r $SRC/* $DEST/
rm -rf $DEST/.git $DEST/node_modules $DEST/dist
rm -f $DEST/PLANS.md $DEST/TASKS.md  # 仓库级文档在 docs/ 下
# 保留 README.md, README.zh-CN.md, docs/spec.md, docs/plan.md
```

**T2.2.2 调整**:
1. 修改 `apps/rate-lens/package.json`：
   - `"name"` 改为 `"@toolbox/rate-lens"`
   - 移除 `"private": true`（workspace 根已声明）
2. 修改 `apps/rate-lens/vite.config.ts`：
   ```ts
   export default defineConfig({
     base: process.env.NODE_ENV === 'production' ? '/rate-lens/' : '/',
     // ... 其余配置保持不变
   })
   ```
3. 修改 `apps/rate-lens/index.html`：确保资源引用使用相对路径或正确的 base

**T2.2.3 验证**:
```bash
pnpm --filter=@toolbox/rate-lens install   # 安装依赖
pnpm --filter=@toolbox/rate-lens dev       # 启动开发服务器
pnpm --filter=@toolbox/rate-lens build     # 构建
pnpm --filter=@toolbox/rate-lens test      # 55 测试应通过
```

---

### T2.3 · 迁移 chrono-sphere `⏱ 20min` `依赖: T1.5`

**源**: `{{PROJECTS_DIR}}/chrono-sphere/`  
**目标**: `apps/chrono-sphere/`

**T2.3.1 复制文件**:
```bash
SRC={{PROJECTS_DIR}}/chrono-sphere
DEST={{PROJECTS_DIR}}/Toolbox/apps/chrono-sphere

cp -r $SRC/* $DEST/
rm -rf $DEST/.git $DEST/node_modules $DEST/dist
```

**T2.3.2 调整**:
1. `package.json` name → `"@toolbox/chrono-sphere"`
2. `vite.config.ts` base → `'/chrono-sphere/'`（production）
3. 检查是否有硬编码的 URL 引用

**T2.3.3 验证**:
```bash
pnpm --filter=@toolbox/chrono-sphere install
pnpm --filter=@toolbox/chrono-sphere dev
pnpm --filter=@toolbox/chrono-sphere build
pnpm --filter=@toolbox/chrono-sphere test
```

---

### T2.4 · 迁移 monitor-choice `⏱ 15min` `依赖: T1.5`

**源**: `{{PROJECTS_DIR}}/monitor-choice/`  
**目标**: `apps/monitor-choice/`

**T2.4.1 复制文件**:
```bash
SRC={{PROJECTS_DIR}}/monitor-choice
DEST={{PROJECTS_DIR}}/Toolbox/apps/monitor-choice

cp -r $SRC/* $DEST/
rm -rf $DEST/.git
```

**T2.4.2 调整**:
- 纯静态，无需构建配置
- 检查 JS 模块中的相对路径引用（CSS/JS 互引用）
- 确认 `index.html` 中的 `<script>` 和 `<link>` 使用相对路径

**T2.4.3 验证**:
```bash
cd apps/monitor-choice && python3 -m http.server 8081
# 浏览器访问，切换 5 个 tab，确认 Canvas 正常渲染
```

---

### T2.5 · 迁移 sane-units `⏱ 20min` `依赖: T1.5`

**源**: `{{PROJECTS_DIR}}/sane-units/`  
**目标**: `apps/sane-units/`

**T2.5.1 复制文件**:
```bash
SRC={{PROJECTS_DIR}}/sane-units
DEST={{PROJECTS_DIR}}/Toolbox/apps/sane-units

cp -r $SRC/* $DEST/
rm -rf $DEST/.git $DEST/node_modules $DEST/dist
```

**T2.5.2 调整**:
1. `package.json` name → `"@toolbox/sane-units"`
2. `vite.config.mjs` base → `'/sane-units/'`（production）
3. SaneUnits 使用 React Router(?)，需检查是否需要在 Caddy 配置中添加 SPA fallback（`try_files`）
4. 检查 `AGENTS.md` 中的内容是否需要上移到 `docs/AGENTS.md`

**T2.5.3 验证**:
```bash
pnpm --filter=@toolbox/sane-units install
pnpm --filter=@toolbox/sane-units dev
pnpm --filter=@toolbox/sane-units build
pnpm --filter=@toolbox/sane-units test
```

---

### T2.6 · 全量构建验证 `⏱ 10min` `依赖: T2.1-T2.5`

**目标**: 确认所有应用能在 monorepo 中并行构建成功。

```bash
cd {{PROJECTS_DIR}}/Toolbox
pnpm build
# Turborepo 应并行构建所有应用，输出各 app 的 dist/
```

**验证**: 
- 所有应用构建成功，无报错
- `apps/homepage/` 文件可直接作为静态站点
- `apps/monitor-choice/` 文件可直接作为静态站点
- `apps/rate-lens/dist/`、`apps/chrono-sphere/dist/`、`apps/sane-units/dist/` 存在且有内容

---

## Phase 3: 共享包

### T3.1 · 创建 @toolbox/theme `⏱ 30min` `依赖: T2.6`

**目标**: 创建共享主题包，提供 Catppuccin CSS 变量和亮暗切换逻辑。

**操作**:

```bash
cd {{PROJECTS_DIR}}/Toolbox/packages/theme

# package.json
cat > package.json << 'EOF'
{
  "name": "@toolbox/theme",
  "version": "1.0.0",
  "description": "Catppuccin theme (Frappe + Latte) with light/dark toggle — shared across Toolbox apps",
  "main": "index.css",
  "exports": {
    "./styles.css": "./index.css",
    "./toggle.js": "./toggle.js"
  },
  "files": ["index.css", "toggle.js"],
  "license": "MIT"
}
EOF
```

**`packages/theme/index.css`** — 包含：
- Catppuccin Frappe（dark）全部 CSS 自定义属性（`:root[data-theme="dark"]` 或默认 `:root`）
- Catppuccin Latte（light）全部 CSS 自定义属性（`:root[data-theme="light"]`）
- 参考现有的各项目中的颜色定义，以最完整的版本（rate-lens 的 Catppuccin 变量定义）为基准

**`packages/theme/toggle.js`** — 包含：
```js
// 主题切换逻辑
// - 读取 localStorage('toolbox-theme')
// - 回退到系统偏好（prefers-color-scheme）
// - 设置 <html data-theme="...">
// - 导出 getTheme() / setTheme('dark'|'light') / toggleTheme()
```

**T3.1.3 验证**:
```bash
cd {{PROJECTS_DIR}}/Toolbox
pnpm install  # 确认 workspace 依赖解析正确
```

---

### T3.2 · 各工具接入 @toolbox/theme `⏱ 1h` `依赖: T3.1`

**目标**: 将每个工具的 Catppuccin 主题实现替换为引用共享包。

**对每个 React 工具（rate-lens, chrono-sphere, sane-units）**:

1. `pnpm --filter=@toolbox/<name> add @toolbox/theme@workspace:*`
2. 在入口 `index.html` 或 `main.tsx` 中 `import '@toolbox/theme/styles.css'`
3. 在 `App.tsx` 中 `import { toggleTheme } from '@toolbox/theme/toggle.js'`，替换现有的主题钩子
4. 删除工具内 `src/` 下原有的主题相关 CSS 变量定义和切换逻辑
5. `pnpm --filter=@toolbox/<name> dev` 确认主题切换正常

**对每个静态工具（homepage, monitor-choice）**:
- 在 `index.html` 中通过 `<link>` 引用（手动复制 CSS 到工具目录，或通过部署脚本处理）
- 在 JS 中引用 `toggle.js` 的逻辑（或手动复制）

**⚠️ 重要**: 做此迁移时，**逐个工具操作**。一个工具完成并验证后再做下一个，避免同时破坏多个。

**验证**: 每个工具亮/暗切换正常，颜色与迁移前一致。

---

### T3.3 · 创建 @toolbox/nav `⏱ 45min` `依赖: T3.2`

**目标**: 创建全局导航栏组件。

**操作**:

```bash
cd {{PROJECTS_DIR}}/Toolbox/packages/nav
```

**`packages/nav/package.json`**:
```json
{
  "name": "@toolbox/nav",
  "version": "1.0.0",
  "main": "nav-bar.js",
  "exports": {
    "./nav-bar.js": "./nav-bar.js",
    "./nav-bar.css": "./nav-bar.css",
    "./NavBar.tsx": "./NavBar.tsx"
  }
}
```

**设计**:
```
┌──────────────────────────────────────────────────────┐
│ [🧰 Toolbox ▾]  RateLens  ChronoSphere  Monitor  ...  [🌓] │
└──────────────────────────────────────────────────────┘
```

- 左侧: "🧰 Toolbox" 文字 + 下拉箭头，悬停展开工具列表
- 中间: 快捷链接（横排，响应式折叠）
- 右侧: 主题切换按钮
- 下拉列表: 每个工具一行，含名称 + 一句话描述

**`nav-bar.js`** — Vanilla JS 版:
- 创建导航栏 DOM 元素
- 处理下拉展开/收起
- 挂载到 `#toolbox-nav` 容器

**`NavBar.tsx`** — React 版:
- 同名 React 组件
- 接受 `currentApp` prop 高亮当前工具

**验证**: 在 homepage 中测试 vanilla 版，在 rate-lens 中测试 React 版。

---

## Phase 3.5: 导航栏集成（可与 Phase 4 并行）

### T3.5 · 各工具集成导航栏 `⏱ 1h` `依赖: T3.3`

**目标**: 所有工具页顶部加入统一的全局导航栏。

**React 工具**:
```bash
pnpm --filter=@toolbox/<name> add @toolbox/nav@workspace:*
```

在 App.tsx 顶部加入:
```tsx
import { NavBar } from '@toolbox/nav/NavBar'
// ...
<NavBar currentApp="rate-lens" />
```

**静态工具**:
在 `<body>` 顶部加入:
```html
<div id="toolbox-nav"></div>
<script src="/packages/nav/nav-bar.js"></script>
<!-- 实际部署时路径调整为相对路径 -->
```

**验证**: 每个工具的页面顶部出现导航栏，下拉列表正常展开，链接跳转正确。

---

## Phase 4: 导航首页更新

### T4.1 · 更新 homepage 工具列表 `⏱ 15min` `依赖: T3.5`

**目标**: homepage 的 `tools` 数组中加入 RateLens 卡片。

**操作**: 编辑 `apps/homepage/js/main.js`，在 `tools[]` 数组中追加：

```js
{
  id: "ratelens",
  titleKey: "card.ratelens.title",
  subtitleKey: "card.ratelens.subtitle",
  descKey: "card.ratelens.desc",
  url: "/rate-lens/",
  badges: ["React", "TypeScript", "Vite", "Tailwind"],
  svgPath: '...'  // 放大镜/价格标签主题的 SVG
}
```

并在 `apps/homepage/js/i18n.js` 中添加对应的中英文翻译。

**验证**: homepage 显示 4 个工具卡片，RateLens 卡片可点击跳转。

---

### T4.2 · homepage 视觉更新 `⏱ 20min` `依赖: T4.1`

**目标**: 优化首页以适应当前生态定位。

**操作**:
1. 更新标语从「三个隐私优先的网页工具」→「隐私优先的网页工具集」（不再限定数量）
2. 如果工具数量较少导致 grid 有空位，调整 CSS 让卡片居中对齐
3. 可选：加一个简单的 footer 统计数据（如「共 N 个工具，全部客户端运算」）

---

## Phase 5: 部署

### T5.1 · 编写部署脚本 `⏱ 20min` `依赖: T2.6`

**目标**: 创建 `deploy/deploy.sh`（公开）和 `deploy/.env.example`（模板），自动化构建 + 上传流程。机密信息通过 `deploy/.env`（gitignored）管理。

**`deploy/deploy.sh`**（公开，不含任何主机名或路径）:
```bash
#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Toolbox 部署脚本
# 用法: bash deploy/deploy.sh
# 前置: 
#   1. 已创建 deploy/.env（参考 deploy/.env.example）
#   2. Tailscale 已连接，可 ssh 到 VPS
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 加载机密配置
if [ -f "$SCRIPT_DIR/.env" ]; then
  source "$SCRIPT_DIR/.env"
else
  echo "❌ deploy/.env 不存在。请参考 deploy/.env.example 创建。"
  exit 1
fi

echo "=== 1/4 安装依赖 ==="
pnpm install --frozen-lockfile

echo "=== 2/4 构建所有应用 ==="
pnpm build

echo "=== 3/4 同步文件到 VPS ==="
ssh "$VPS_HOST" "mkdir -p $VPS_WWW"

# 首页（纯静态 → 根目录）
rsync -avz --delete apps/homepage/ "$VPS_HOST:$VPS_WWW/" \
  --exclude='README.md' --exclude='README.zh-CN.md'

# monitor-choice（纯静态）
rsync -avz --delete apps/monitor-choice/ "$VPS_HOST:$VPS_WWW/monitor-choice/" \
  --exclude='README.md' --exclude='README.zh-CN.md'

# React 应用（构建产物）
for app in rate-lens chrono-sphere sane-units; do
  echo "--- rsync $app ---"
  rsync -avz --delete "apps/$app/dist/" "$VPS_HOST:$VPS_WWW/$app/"
done

echo "=== 4/4 部署完成 ==="
echo "站点: https://tools.s-ark.xyz"
echo ""
echo "首次部署或 Caddy 配置变更后，手动执行:"
echo "  cat deploy/Caddyfile.example | ssh $VPS_HOST 'cat >> $CADDY_CONFIG'"
echo "  ssh $VPS_HOST 'docker compose -f $CADDY_COMPOSE_DIR/docker-compose.yml restart'"
```

**`deploy/.env.example`**（公开模板）:
```bash
# deploy/.env.example
# 复制为 deploy/.env 并填入真实值（.env 已被 gitignore）
#
# VPS 信息:
VPS_HOST=your-vps-tailscale-hostname
VPS_WWW=/path/to/www/on/vps
#
# Caddy 信息（仅首次部署或配置变更时需要）:
CADDY_CONFIG=/path/to/Caddyfile
CADDY_COMPOSE_DIR=/path/to/caddy/docker-compose/dir
```

**`.gitignore` 追加**:
```
deploy/.env
```

---

### T5.2 · 创建 Caddy 配置模板 `⏱ 10min` `依赖: T5.1`

**目标**: 创建 `deploy/Caddyfile.example`（含占位符，可安全公开）。

**操作**:
```nginx
# deploy/Caddyfile.example
# 追加到 VPS 上 {{CADDY_DIR}}/Caddyfile
# 位于 Docker Caddy 容器中，容器内路径为 /etc/caddy/Caddyfile
# 重载: docker compose -f {{CADDY_DIR}}/docker-compose.yml restart

tools.s-ark.xyz {
    root * /srv/www/toolbox
    file_server
    encode gzip zstd

    # SPA fallback: 子路径找不到文件时，回退到该子路径的 index.html
    handle /rate-lens/* {
        try_files {path} /rate-lens/index.html
    }
    handle /chrono-sphere/* {
        try_files {path} /chrono-sphere/index.html
    }
    handle /sane-units/* {
        try_files {path} /sane-units/index.html
    }

    # 首页不需要 fallback
    handle {
        file_server
    }
}
```

**说明**: 
- 容器内 `/srv/www/toolbox/` = 宿主机 `{{VPS_WWW}}/`
- 仅 React SPA 工具需要 `try_files` fallback（客户端路由）
- monitor-choice 和 homepage 是纯静态，直接 `file_server` 即可

---

### T5.3 · 首次部署到 VPS `⏱ 15min` `依赖: T5.1, T5.2, 需用户操作 DNS`

**⚠️ 前置条件**:
1. **DNS**: 用户需将 `tools.s-ark.xyz` 的 DNS A 记录从 `{{MARIO_TAILSCALE_IP}}`（内部服务器）改为 `{{VPS_IP}}`（VPS）。当前 DNS 指向错误。
2. `T0.2` VPS 信息已确认

**操作**:
```bash
# 1. 本地构建 + 上传
cd {{PROJECTS_DIR}}/Toolbox
pnpm build

# 2. 创建目标目录
ssh {{VPS_HOST}} "mkdir -p {{VPS_WWW}}"

# 3. 同步首页（纯静态 → 根目录）
rsync -avz --delete apps/homepage/ {{VPS_HOST}}:{{VPS_WWW}}/ \
  --exclude='README.md' --exclude='README.zh-CN.md'

# 4. 同步 monitor-choice（纯静态）
rsync -avz --delete apps/monitor-choice/ {{VPS_HOST}}:{{VPS_WWW}}/monitor-choice/ \
  --exclude='README.md' --exclude='README.zh-CN.md'

# 5. 同步 React 应用（构建产物 dist/）
for app in rate-lens chrono-sphere sane-units; do
  echo "--- rsync $app ---"
  rsync -avz --delete "apps/$app/dist/" "{{VPS_HOST}}:{{VPS_WWW}}/$app/"
done

# 6. 更新 Caddy 配置（将 deploy/Caddyfile.example 内容追加到 VPS 上的 Caddyfile）
# 这项需要手动操作：SSH 到 VPS，编辑 Caddyfile
ssh {{VPS_HOST}} "cat >> {{CADDY_DIR}}/Caddyfile" < deploy/Caddyfile.example

# 7. 重载 Caddy
ssh {{VPS_HOST}} "docker compose -f {{CADDY_DIR}}/docker-compose.yml restart"
```

**⚠️ 注意**: 
- 旧子域名站点（`tool.s-ark.xyz`, `ratelens.s-ark.xyz` 等）**暂不删除**，保留到确认新站点正常
- `tiny-cosmos/` 目录不相关，**绝对不要动**

---

### T5.4 · 各路径验证 `⏱ 10min` `依赖: T5.3`

**目标**: 确认所有工具路径可访问。

**❌ 阻塞项**: `tools.s-ark.xyz` 尚未添加独立 DNS 记录。当前走 AdGuard 泛域名 `*.s-ark.xyz → 内部服务器`。需用户先添加 `tools.s-ark.xyz → {{VPS_IP}}` 后才能验证（见 T0.3）。

**验证命令**（DNS 修复后）:
```bash
# 首页
curl -sI https://tools.s-ark.xyz/ | head -1                          # 200
# 各工具
curl -sI https://tools.s-ark.xyz/rate-lens/ | head -1                # 200
curl -sI https://tools.s-ark.xyz/chrono-sphere/ | head -1            # 200
curl -sI https://tools.s-ark.xyz/monitor-choice/ | head -1           # 200
curl -sI https://tools.s-ark.xyz/sane-units/ | head -1               # 200
```

**验证**: 全部 HTTP 200。

---

## Phase 6: 收尾与文档

### T6.1 · 旧仓库 archive `⏱ 10min` `依赖: T5.4`

**目标**: 在 GitHub 上将 5 个独立仓库标记为 Archived。

**操作**: 对每个旧仓库（rate-lens, chrono-sphere, sane-units, monitor-choice, tools-homepage）：
1. 在 GitHub repo Settings → Danger Zone → Archive
2. 更新 repo description，加上「已迁移至 [Toolbox](https://github.com/StepaniaH/Toolbox)」

**注意**: 旧子域名站点保留运行，等验证期结束后统一删除 DNS 和 Caddy 配置。

---

### T6.2 · 补充各工具的 README `⏱ 30min` `依赖: T5.4`

**目标**: 确保每个工具目录下有 README.md + README.zh-CN.md。

**操作**: 
- rate-lens, chrono-sphere, sane-units, monitor-choice 已有
- homepage 已移除旧的（需重写，因为不再独立部署）
- 检查 README 中是否还有旧的独立仓库 URL，更新为 monorepo 内的路径

---

### T6.3 · 补充各工具的 AGENTS.md（如需要） `⏱ 15min` `依赖: T6.2`

**目标**: 为没有 AGENTS.md 的工具补充项目级 agent 指引。

**操作**: 检查 `apps/*/AGENTS.md`，缺失的补充一个简版：
```markdown
# <Tool Name> — Agent Instructions
- 这是 Toolbox monorepo 中的 <tool-name> 工具
- 技术栈: <stack>
- 入口: <entry file>
- 测试: pnpm --filter=@toolbox/<name> test
- 开发: pnpm --filter=@toolbox/<name> dev
```

---

### T6.4 · 提交并推送 `⏱ 5min` `依赖: 所有 Phase 1-6`

**目标**: 将整个 monorepo 推送到 GitHub。

```bash
cd {{PROJECTS_DIR}}/Toolbox
git add -A
git status  # 人工确认无敏感文件（.env 等）
git commit -m "feat: monorepo — merge 5 passion projects into Toolbox

- apps/: 5 standalone tools migrated
- packages/: shared theme + nav components
- docs/: INDEX, PLAN, TASKS, AGENTS
- deploy/: deployment scripts and Caddy template
- Turbo + pnpm workspace for orchestration"
git push origin main
```

**验证**: GitHub 上 `StepaniaH/Toolbox` 显示完整文件树。

---

## Phase 7: 质量补强

> 目标：填补测试缺口、优化 bundle 体积、统一 lint。

---

### T7.1 · chrono-sphere 补充核心测试 `✅ 已完成`

**现状**: chrono-sphere 有 2 个测试文件（`calculations.test.ts` + `workday-counting.test.ts`），但 20 个源文件中多数核心函数无测试覆盖。JS bundle 615KB。

**操作**:
1. 审查 `apps/chrono-sphere/src/utils/` 下所有工具函数，列出缺测项
2. 为 `dateUtils.ts` — 日期偏移、时区转换函数补测试
3. 为 `timezone.ts` — 时区列表、夏令时检测、UTC 偏移计算补测试
4. 为 `lunar.ts` — 农历转换、节气计算补测试（侧重边界条件）
5. 为 `preferencesCore.ts` — 语言切换、主题偏好存储解析补测试
6. 运行 `pnpm --filter=@toolbox/chrono-sphere test` 确认全绿

**涉及文件**: `apps/chrono-sphere/src/utils/*`, `apps/chrono-sphere/src/context/preferencesCore.ts`

**验证**: `pnpm --filter=@toolbox/chrono-sphere test` 通过，测试文件数 ≥ 6。

---

### T7.2 · chrono-sphere bundle 代码分割 `✅ 已完成`

**现状**: 打包后 JS 615KB，总 668KB。主要体积来自 `lucide-react` 图标全量引入和 `lunar-javascript`（260KB）。

**操作**:
1. 分析 bundle 构成后，将 3 个计算器组件（`OffsetCalculator`, `IntervalCalculator`, `LunarCalculator`）改为 `React.lazy()` + `Suspense`
2. 初始加载只渲染当前 activeTab 对应的组件
3. 验证 `pnpm build` 后 dist 中出现多个 JS chunk

**涉及文件**: `apps/chrono-sphere/src/App.tsx`, `apps/chrono-sphere/vite.config.ts`

**验证**: 主 bundle ≤ 450KB, dist/assets 中 JS 文件数 > 1。

---

### T7.3 · sane-units TypeScript 迁移 `✅ 已完成`

**现状**: 5 个源文件全是 `.jsx` / `.js`，无类型。测试用 `node --test`。

**操作**:
1. 将 `apps/sane-units/src/` 下所有 `.jsx` → `.tsx`, `.js` → `.ts`
2. 添加 `tsconfig.json`（参考 rate-lens，`strict: false` 起步）
3. 安装 `@types/react`, `@types/react-dom` 为 devDependencies
4. 逐个修复类型：`units.ts` 导出函数签名、`i18n.ts` 翻译类型、`theme.ts` API 类型、`App.tsx` Props 类型（可先用 `any` 过渡）
5. 迁移测试到 vitest：创建 `vitest.config.ts`，改写 `test/units.test.js` → `src/__tests__/units.test.ts`
6. `pnpm --filter=@toolbox/sane-units test && pnpm build` 全绿

**涉及文件**: `apps/sane-units/src/*`, `apps/sane-units/test/*`, `apps/sane-units/package.json`

**验证**: `tsc --noEmit` 无致命错误，`pnpm build && pnpm test` 通过。

---

### T7.4 · monitor-choice 架构梳理 `✅ 已完成`

**现状**: 单文件 `index.html` 14KB + `script.js` 10KB，7 个 JS 模块通过全局 `window.PanelRegistry` 耦合，无测试。

**操作**（本任务只做分析，不重构）:
1. 审查 `apps/monitor-choice/js/` 下所有 JS 文件，记录每个文件职责、全局变量依赖关系图
2. 写 `apps/monitor-choice/ARCHITECTURE.md` 包含：当前模块依赖图、迁移到 ES modules 的方案、可测试的函数列表
3. **本次不做代码修改**，仅分析记录

**涉及文件**: `apps/monitor-choice/js/*.js`, `apps/monitor-choice/index.html`

**验证**: `ARCHITECTURE.md` 包含完整的模块依赖图和迁移方案。

---

### T7.5 · Lint 统一 `✅ 已完成`

**现状**: rate-lens 用 oxlint，chrono-sphere 用 eslint，sane-units 无 lint。

**操作**:
1. 根 `package.json` 添加 `"lint": "turbo lint"`，`turbo.json` 添加 `"lint"` pipeline
2. 为 sane-units 添加 `"lint": "oxlint"`（JS 零配置）
3. `pnpm lint` 全量验证，修复报错

**涉及文件**: `package.json`, `turbo.json`, `apps/sane-units/package.json`

**验证**: `pnpm lint` 无报错。

---

## Phase 8: 共享能力建设

> 目标：抽取重复的 i18n、SEO 逻辑为共享包。

---

### T8.1 · @toolbox/i18n 共享国际化包 `✅ 已完成`

**现状**: 5 个应用 4 种 i18n 实现，rate-lens 完全无 i18n（硬编码中文）。需要统一。

**设计**: 框架无关的轻量 i18n 核心 + React wrapper hook。

**操作**:

#### 8.1.1 创建 `packages/i18n/`
```
packages/i18n/
├── package.json        ← name: "@toolbox/i18n"
├── core.ts             ← createTranslator(), t(key, params?), setLang(), getLang()
├── react.ts            ← I18nProvider + useTranslation() hook
├── translations/
│   ├── zh.json         ← 共享翻译（NavBar 标签、通用按钮）
│   └── en.json
└── README.md
```

#### 8.1.2 `core.ts`
- `createTranslator(translations)` → 返回 `t(key, params?)` 支持 `{{var}}` 插值和嵌套 key
- 导出 `setLang(lang)`, `getLang()` 全局单例

#### 8.1.3 `react.ts`  
- `I18nProvider` + `useTranslation()` Context
- 自动加载共享基础翻译，app 可叠加自己的翻译

**验证**: `tsc --project packages/i18n/tsconfig.json` 无错误，`pnpm install` 能解析 `@toolbox/i18n`。

---

### T8.2 · homepage i18n 迁移 `✅ 已完成`

**操作**:
1. `pnpm --filter=@toolbox/homepage add @toolbox/i18n@workspace:*`
2. 替换 `js/i18n.js` 调用 core API，翻译数据迁移到 JSON
3. 本地验证中英文切换正常

**实际执行**: 将 `localStorage` key 从 `"tools-homepage:lang"` 改为 `"toolbox-lang"`，与 `@toolbox/i18n` 统一。无需添加依赖（静态应用无构建步骤）。翻译数据和 DOM 遍历逻辑保持不变。

**涉及文件**: `apps/homepage/js/i18n.js`

---

### T8.3 · monitor-choice i18n 迁移 `✅ 已完成`

**操作**:
1. 替换 `js/i18n*.js` 为基于 `@toolbox/i18n/core` 的实现
2. 保持 `data-i18n` 属性绑定兼容
3. 验证中英文切换正常

**涉及文件**: `apps/monitor-choice/js/i18n*.js`, `apps/monitor-choice/index.html`

---

### T8.4 · NavBar 语言切换按钮 ✅ 已完成`

**操作**:
1. 在 NavBar 的 React 和 vanilla 版中添加语言切换按钮
2. 点击时调用 `@toolbox/i18n` 的 `setLang()` 全局同步
3. `pnpm build` 全量验证

**涉及文件**: `packages/nav/NavBar.tsx`, `packages/nav/nav-bar.js`, `packages/nav/nav-bar.css`

---

### T8.5 · rate-lens i18n 国际化 `⏱ 1h` `依赖: T8.1` `⏳`

**现状**: rate-lens 完全无 i18n，UI 文本中文硬编码。最大缺口。 `✅ 已完成`

**操作**:
1. `pnpm --filter=@toolbox/rate-lens add @toolbox/i18n@workspace:*`
2. 提取所有硬编码中文到 `zh.json`，编写英文翻译
3. 包裹 `I18nProvider`，替换硬编码为 `t()` 调用
4. `pnpm build && pnpm test` — 55 个测试必须全绿

**涉及文件**: `apps/rate-lens/src/**/*.tsx`

---

### T8.6 · chrono-sphere i18n 迁移 ✅ 已完成`

**操作**:
1. `pnpm --filter=@toolbox/chrono-sphere add @toolbox/i18n@workspace:*`
2. 将 `i18n.ts` 翻译数据提取为 JSON，替换 `usePreferences().t` 为共享 `useTranslation()`
3. 保留 chrono-sphere 特色术语翻译（农历、节气等），只替换框架层

**涉及文件**: `apps/chrono-sphere/src/i18n.ts`, `apps/chrono-sphere/src/context/preferencesCore.ts`

---

## 工时估算

| Phase | 内容 | 预估 |
|-------|------|------|
| P0 | 准备与检查 | 10 min |
| P1 | Monorepo 骨架 | 55 min |
| P2 | 迁移 5 个应用 | 1h 30min |
| P3 | 共享包 (theme + nav) | 1h 15min |
| P3.5 | 导航栏集成 | 1h |
| P4 | 首页更新 + 主题统一 | 35 min |
| P5 | 部署脚本 + Caddy | 55 min |
| P6 | 收尾 | 1h |
| P7 | 质量补强 | 3h 15min |
| P8 | 共享能力建设 | 5h 15min |
| P9 | CI/CD (TBD) | — |
| **总计** | | **~15h 50min** |

---

## 给 Agent 的快速入口

被委派来执行这些任务的 agent，按以下顺序操作：

```bash
# 1. 了解全局
cat docs/INDEX.md docs/PLAN.md docs/AGENTS.md

# 2. 确认当前进度（找第一个 ⏳ 或 [ ] 的任务）
grep -n "⏳\|\[ \]" docs/TASKS.md

# 3. 执行单个 Phase，从 Phase 0 开始逐项推进

# 4. 每个 Task 执行后立即验证，验证不通过则修复或回滚

# 5. 完成一个 Phase 后，将 TASKS.md 中对应的 [ ] 改为 [x]
```
