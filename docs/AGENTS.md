# AGENTS.md — AI Agent 操作规范

> 本文档为所有参与 Toolbox 开发的 AI agent（Codex、OpenCode、Claude Code 等）提供统一的操作指引。
>
> **阅读顺序**: 先读本文档（操作规范）→ 再读 [`INDEX.md`](./INDEX.md)（项目全景）→ 再读 [`PLAN.md`](./PLAN.md)（架构方向）→ 再看 [`TASKS.md`](./TASKS.md)（当前任务）。

---

## 一、仓库结构认知

```
Toolbox/
├── apps/                   ← 各独立工具，横向隔离
│   ├── homepage/           ← 纯静态 HTML
│   ├── rate-lens/          ← React + TypeScript
│   ├── chrono-sphere/      ← React + TypeScript
│   ├── monitor-choice/     ← 纯静态 Vanilla JS
│   └── sane-units/         ← React + JavaScript
│
├── packages/               ← 共享包，全仓引用
│   ├── theme/              ← Catppuccin CSS + 切换逻辑
│   └── nav/                ← 全局导航栏
│
├── deploy/                 ← 部署模板（机密信息在 .env 中，gitignored）
├── docs/                   ← 仓库级文档（INDEX / PLAN / TASKS / AGENTS）
│
├── package.json            ← pnpm workspace 根
├── turbo.json              ← Turborepo 构建编排
└── pnpm-workspace.yaml
```

---

## 二、红线（绝对不可违反）

### 安全与隐私

| # | 规则 | 说明 |
|---|------|------|
| 1 | **不引入后端/数据库/登录** | 所有工具纯客户端运行。不添加任何服务端依赖 |
| 2 | **不引入第三方追踪** | 无 Google Analytics、无埋点、无遥测——除非用户明确要求并指定 ID |
| 3 | **不公开 VPS 路径或 SSH 信息** | 机密信息仅在 `deploy/.env`（gitignored）中。如需引用部署路径，使用 `{{PLACEHOLDER}}` 占位符 |
| 4 | **不在 git 中提交任何密钥/Token/IP/内部域名** | 提交前自查 `git diff --cached`。如果 `deploy/.env` 出现在 staged changes 中，立即 `git reset` |

### 架构边界

| # | 规则 | 说明 |
|---|------|------|
| 5 | **不修改 `packages/` 下的文件** | 共享包是稳定层。除非用户明确说「改 theme 包」或「改 nav 包」 |
| 6 | **修改工具 A 不动工具 B** | `apps/rate-lens/` 和 `apps/chrono-sphere/` 完全独立。跨工具重构需用户确认 |
| 7 | **新增工具必须引用共享包** | `@toolbox/theme`（主题）+ `@toolbox/nav`（导航栏），不复制代码 |

### 质量

| # | 规则 | 说明 |
|---|------|------|
| 8 | **任何逻辑改动必须有测试** | 新增计算函数 → 加单元测试。新增组件 → 加渲染测试。修复 bug → 先写复现测试 |
| 9 | **破坏性变更必须跑全量测试** | `pnpm test` 必须全绿后再提交 |
| 10 | **构建不能破** | `pnpm build` 必须全绿后再提交 |

---

## 三、开发工作流

### 3.1 分支策略

```
main ───────────────────────────── ● (稳定，可直接部署)
  │
  └── dev ──────────────────────── ● (日常开发)
        │
        └── feat/xxx ───────────── ● (单功能分支)
```

- **日常开发**: 在 `dev` 分支进行
- **单独功能**: 从 `dev` 切出 `feat/<功能名>` 分支
- **合并**: `feat/*` → `dev`（PR）→ `main`（用户确认后）
- **不直接在 `main` 上提交**

### 3.2 日常操作命令

```bash
# 安装依赖
pnpm install

# 开发单个工具
pnpm --filter=@toolbox/rate-lens dev

# 构建单个工具
pnpm --filter=@toolbox/rate-lens build

# 测试单个工具
pnpm --filter=@toolbox/rate-lens test

# 全量构建（提交前必跑）
pnpm build

# 全量测试（提交前必跑）
pnpm test
```

### 3.3 提交规范

```bash
# 提交前检查
pnpm build && pnpm test    # 必须全绿
git status                  # 确认无 .env 等敏感文件
git diff --cached           # 逐行自查（见下方隐私自查清单）
```

#### 3.3.1 隐私自查清单

提交前必须逐行检查 `git diff --cached`，**任何一项命中 → 立即 `git reset` 修复**：

| 检查项 | 正则 / 特征 |
|--------|------------|
| VPS 公网 IP | 非 RFC 1918 的公网地址出现在不该出现的地方 |
| Tailscale IP（内部） | `100.x.x.x` 段（CGNAT） |
| 内部主机名 | 局域网/VPN 主机名 |
| 绝对路径含用户名 | `/home/<user>/` 等包含真实用户名的路径 |
| SSH 私钥 | `BEGIN OPENSSH PRIVATE KEY` |
| 密钥 / Token | `sk-`, `Bearer`, `api_key` |

#### 3.3.2 文件分类

| 内容类型 | 存放位置 | git? |
|----------|---------|:--:|
| 项目文档 (INDEX, PLAN, TASKS, AGENTS) | `docs/` | ✅ |
| 部署模板 | `deploy/*.example` | ✅ |
| CI workflow | `.github/workflows/` | ✅ |
| **排查/调试记录** | 本地文件 或 发到 Telegram | ❌ |
| 机密配置 | `deploy/.env` | ❌ |
| AI agent 工作计划 | `.hermes/` | ❌ |

#### 3.3.3 Commit message 格式
<type>: <简短描述>

类型: feat / fix / refactor / style / test / docs / chore

示例:
feat: add global nav bar to all tools
fix: monitor-choice canvas crash on theme switch
docs: update deploy instructions
```

### 3.4 任务追踪

Agent 执行 TASKS.md 中的任务时，**必须在 TASKS.md 中同步进度**：

```markdown
### T2.2 · 迁移 rate-lens `⏱ 20min` `依赖: T1.5` `🔄 进行中`
```

- 开始任务时：将标题后缀改为 `🔄 进行中`
- 完成任务时：将标题后缀改为 `✅ 已完成`，在对应步骤的 `- [ ]` 改为 `- [x]`
- 遇到阻塞时：在任务下添加 `**阻塞**: <原因>`，不要强行推进
- 所有 agent 共享同一份 TASKS.md，**操作前先确认没有其他 agent 在同一任务上**

---

## 四、部署流程

### 4.1 机密管理

```
deploy/
├── .env                  ← gitignored（机密：VPS host、路径）
├── deploy.sh             ← 公开（构建 + rsync，从 .env 读取变量）
├── Caddyfile.example     ← 公开（含占位符的模板）
└── README.md             ← 公开（部署指引）
```

**新机器初始化时**，手动创建 `deploy/.env`：
```bash
# deploy/.env（不入仓，每台机器自行维护）
VPS_HOST={{VPS_HOST}}
VPS_WWW={{VPS_WWW}}
```

`deploy.sh` 通过 `source deploy/.env` 读取，脚本本身不硬编码任何机密。

### 4.2 部署命令

```bash
# 首次部署（需同时更新 Caddy 配置）
bash deploy/deploy.sh

# 后续日常更新（Caddy 不变，只 rsync 文件）
bash deploy/deploy.sh

# 更新 Caddy 配置（仅在站点配置变更时需要）
cat deploy/Caddyfile.example | ssh $VPS_HOST 'cat >> ~/docker_projects/caddy/Caddyfile'
ssh $VPS_HOST 'docker compose -f ~/docker_projects/caddy/docker-compose.yml restart'
```

---

## 五、新增工具 Checklist

1. `cp -r apps/_template apps/new-tool`
2. 修改 `apps/new-tool/package.json` → `"name": "@toolbox/new-tool"`
3. `pnpm --filter=@toolbox/new-tool add @toolbox/theme@workspace:* @toolbox/nav@workspace:*`
4. 在 `turbo.json` 的 `pipeline` 中添加 `"@toolbox/new-tool#build"` 等任务
5. 在 `apps/homepage/js/main.js` 的 `tools[]` 数组中添加卡片
6. 在 `apps/homepage/js/i18n.js` 中添加中英文翻译
7. 在 `packages/nav/` 的链接列表中追加新工具
8. 写 `README.md` + `README.zh-CN.md`
9. 写 `AGENTS.md`（简版：技术栈、入口文件、测试命令）
10. `pnpm build && pnpm test` — 全量验证
11. 提交 → PR → 合并到 `dev`

---

## 六、文档导航

| 我想… | 读这份 |
|--------|--------|
| 了解项目是什么、有哪些工具 | [`INDEX.md`](./INDEX.md) |
| 了解架构设计、为什么这样决策 | [`PLAN.md`](./PLAN.md) |
| 执行具体开发任务 | [`TASKS.md`](./TASKS.md) |
| 了解 agent 操作规则（你正在读） | 本文档 |
| 了解某个工具的细节 | `apps/<tool>/README.md` |
| 学习如何部署 | `deploy/README.md` |
