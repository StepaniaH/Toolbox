# Toolbox — 项目全景

> 最后核对：2026-07-11 · 当前稳定版本：`v0.1`
>
> `main` 是已部署的稳定线；所有日常修改只在 `dev`（或从 `dev` 派生的功能分支）进行。

## 一、项目定位

Toolbox 是一个开源、隐私优先的网页工具集合。每个工具解决一个明确问题，尽量在浏览器本地完成计算，以静态文件独立构建和部署。

项目的长期目标不是让所有工具长得完全相同，而是同时守住两个不变量：

1. 新工具的加入不能降低现有工具的稳定性。
2. 所有工具共享可靠的主题、明暗模式、语言、导航、交互和无障碍基础。

架构路线见 [PLAN.md](./PLAN.md)，界面契约见 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)，新增工具流程见 [NEW_TOOL.md](./NEW_TOOL.md)。

## 二、工具目录

| 工具 | 路径 | 技术栈 | 主要职责 | 自动化测试 |
|------|------|--------|----------|:----------:|
| Homepage | `/` | Vanilla JS + Vite + Plain CSS | 工具目录与项目入口 | 5 |
| RateLens | `/rate-lens/` | React + TypeScript + Vite + Tailwind | AI 模型价格倍率计算 | 61 |
| ChronoSphere | `/chrono-sphere/` | React + TypeScript + Vite | 日期、区间、时区、农历 | 844 |
| Monitor Choice | `/monitor-choice/` | Vanilla JS + Vite + Canvas | 显示器参数实验室 | 10 |
| SaneUnits | `/sane-units/` | React + TypeScript + Vite + Plain CSS | 单位换算与现实估算 | 17 |

测试数量只用于说明覆盖现状，不作为质量本身的替代指标。5 个应用当前有 937 条测试，另有 5 条 app manifest 和 11 条 theme 契约测试；`pnpm test` 共运行 953 条。`v0.1` 发布时为 910 条。

## 三、仓库结构

```text
Toolbox/
├── apps/                 # 工具应用；应用之间不得直接依赖
│   ├── homepage/
│   ├── rate-lens/
│   ├── chrono-sphere/
│   ├── monitor-choice/
│   └── sane-units/
├── packages/             # 跨应用平台能力
│   ├── theme/            # 主题 token 与切换运行时
│   ├── nav/              # React / Vanilla 导航实现
│   ├── i18n/             # 语言状态与 React Provider
│   └── app-manifest/     # 应用目录、路径与公开状态
├── docs/                 # 架构、规范、任务和 agent 约束
├── deploy/               # 可公开的部署脚本与配置模板
├── .github/workflows/    # CI 与 main 部署流程
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json
```

## 四、当前架构事实

### 应用隔离

- 五个工具都由 Vite 独立构建，分别输出自己的 `dist/`；Vanilla 与 React 应用使用同一质量流水线。
- 工具之间没有 `apps/* → apps/*` 依赖，这是当前最重要的稳定性边界。
- 同一域名下使用路径路由；各应用必须正确设置自己的生产 `base`。
- 受控工具链版本集中在 `pnpm-workspace.yaml` catalog；当前保留 Vite 6 稳定线与 Vite 7/8 显式迁移线，完整解析结果只由根锁文件记录。

### 共享能力的真实接入状态

| 能力 | React 工具 | 静态工具 | 当前问题 |
|------|------------|----------|----------|
| `@toolbox/i18n` | RateLens、ChronoSphere 直接使用；SaneUnits 有兼容桥 | Homepage 使用 core；Monitor Choice 通过 core adapter 驱动自有翻译表 | 翻译资源与调用方式仍不完全统一 |
| `@toolbox/nav` | 三个工具直接使用 React 组件 | Homepage 与 Monitor Choice 直接使用 workspace Vanilla 运行时 | React / Vanilla API 仍是两种入口 |
| `@toolbox/theme` | 三个 React 工具尚未作为依赖接入 | Homepage 与 Monitor Choice 使用 workspace 运行时并保留页面 token | v1 契约已冻结并测试，仍需分应用迁移 |
| `@toolbox/app-manifest` | React Nav 统一消费 stable 目录 | Homepage 与 Vanilla Nav 消费同一目录 | 页面专属图标/长文案仍由应用拥有 |

因此，当前是“共享导航/i18n 已部分落地，主题仍主要靠约定保持接近”，而不是完整设计系统。后续要通过版本化契约和自动一致性检查解决，不能只靠继续复制 CSS。

### 用户偏好

- 全局语言键：`toolbox-lang`
- 全局主题键：`toolbox-theme`
- 工具私有状态应使用 `toolbox.<app-id>.*` 命名，避免同域名下互相覆盖。
- 用户内容默认不得离开浏览器；任何可选外部请求必须显式说明并由用户触发。

## 五、质量基线

2026-07-10 在当前 `dev` 完成基线验证：

| 检查 | 结果 | 备注 |
|------|------|------|
| `pnpm build` | 通过 | 5 个 Vite 应用构建成功 |
| `pnpm test` | 通过 | 953 tests；数量不等同于覆盖率 |
| `pnpm lint` | 通过 | 当前参与根 lint 的应用为 0 warning |
| `pnpm check:privacy` | 通过 | 未发现实际密钥、真实绝对路径、内网/Tailscale IP；仍需人工复查 staged diff |
| `pnpm check:contracts` | 通过 | 应用隔离、包/base/output、依赖 catalog、storage、网络 allowlist 与 Nav 状态通过 |

当前最明显的质量缺口：

- 三个 React 工具尚未直接消费 `@toolbox/theme`，页面 token 也未形成完整的单一事实源。
- SaneUnits 在共享导航之外保留了第二套主题/语言控件，页面骨架和其他工具差异最大。

这些问题的执行优先级见 [TASKS.md](./TASKS.md)。

## 六、隐私边界

允许公开的内容：项目公开域名、公开仓库地址、开源作者署名、维护者确认公开的 GitHub 提交邮箱、通用部署示例。

禁止进入仓库或 Git 历史的内容：真实服务器 IP/端口、内网域名、VPN 地址、SSH 信息、真实部署路径、密钥、Token、私有邮箱、个人设备路径和调试转储。

部署文档只描述接口与占位符，不记录服务器供应商、机房位置或内部拓扑。既有 Git 历史的任何改写都属于破坏性操作，必须由维护者明确批准。

## 七、常用命令

```bash
pnpm install --frozen-lockfile
pnpm check:privacy
pnpm check:contracts
pnpm build
pnpm test
pnpm lint
```

单工具命令使用 workspace 名称，例如：

```bash
pnpm --filter=@toolbox/rate-lens test
```

## 八、文档导航

| 文档 | 用途 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 分支、隐私、编辑和验证红线 |
| [PLAN.md](./PLAN.md) | 当前判断、目标架构、ADR 与演进顺序 |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | 主题、语言、导航和交互的规范性契约 |
| [NEW_TOOL.md](./NEW_TOOL.md) | “积木式”新增工具的开发手册 |
| [DEPENDENCIES.md](./DEPENDENCIES.md) | 工具链 catalog、升级边界与回滚方式 |
| [TASKS.md](./TASKS.md) | 当前可执行任务与进度 |
| [../CHANGELOG.md](../CHANGELOG.md) | 已发布版本的结果记录 |
