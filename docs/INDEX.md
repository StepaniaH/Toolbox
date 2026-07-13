# Toolbox — 项目全景

> 最后核对：2026-07-13 · 当前生产稳定版本：`v0.2.3` · 当前 dev 候选：`v0.2.6`
>
> `main` 是已部署的稳定线；`dev` 是审核集成线；新工具只在从 `dev` 派生的
> `newdev/<tool-id>` 分支实现。

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
| RateLens | `/rate-lens/` | React + TypeScript + Vite + Tailwind | AI 模型价格倍率计算 | 63 |
| ChronoSphere | `/chrono-sphere/` | React + TypeScript + Vite | 日期、区间、时区、农历 | 844 |
| Monitor Choice | `/monitor-choice/` | Vanilla JS + Vite + Canvas | 显示器参数实验室 | 18 |
| SaneUnits | `/sane-units/` | React + TypeScript + Vite + Plain CSS | 单位换算与现实估算 | 20 |
| FormTran | `/image-converter/` | React + TypeScript + Vite + Plain CSS | 浏览器本地文件识别、转换与检查工作台 | 47 |

测试数量只用于说明覆盖现状，不作为质量本身的替代指标。6 个应用当前有 997 条测试，另有 5 条 app manifest 和 11 条 theme 契约测试；完整工作区共运行 1,013 条。`v0.1` 发布时为 910 条。

## 三、仓库结构

```text
Toolbox/
├── apps/                 # 工具应用；应用之间不得直接依赖
│   ├── homepage/
│   ├── rate-lens/
│   ├── chrono-sphere/
│   ├── monitor-choice/
│   ├── sane-units/
│   └── image-converter/
├── packages/             # 跨应用平台能力
│   ├── theme/            # 主题 token 与切换运行时
│   ├── nav/              # React / Vanilla 导航实现
│   ├── i18n/             # 语言状态与 React Provider
│   └── app-manifest/     # 应用目录、路径与公开状态
├── docs/                 # 架构、规范、任务和 agent 约束
├── deploy/               # 可公开的部署脚本与配置模板
├── .github/workflows/    # CI 与 main 手动部署流程
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json
```

## 四、当前架构事实

### 应用隔离

- 六个工具都由 Vite 独立构建，分别输出自己的 `dist/`；Vanilla 与 React 应用使用同一质量流水线。
- 工具之间没有 `apps/* → apps/*` 依赖，这是当前最重要的稳定性边界。
- 同一域名下使用路径路由；各应用必须正确设置自己的生产 `base`。
- 受控工具链版本集中在 `pnpm-workspace.yaml` catalog；当前保留 Vite 6 稳定线与 Vite 7/8 显式迁移线，完整解析结果只由根锁文件记录。

### 共享能力的真实接入状态

| 能力 | React 工具 | 静态工具 | 当前问题 |
|------|------------|----------|----------|
| `@toolbox/i18n` | RateLens、ChronoSphere、FormTran 直接使用；SaneUnits 有兼容桥 | Homepage 使用 core；Monitor Choice 通过 core adapter 驱动自有翻译表 | 翻译资源与调用方式仍不完全统一 |
| `@toolbox/nav` | 四个工具直接使用 React 组件 | Homepage 与 Monitor Choice 直接使用 workspace Vanilla 运行时 | React / Vanilla API 仍是两种入口 |
| `@toolbox/theme` | 四个 React 工具均已消费 v1 runtime 契约 | Homepage 与 Monitor Choice 使用 workspace runtime | 所有页面仍保留 app-specific token 映射，语义 CSS token 需逐个迁移 |
| `@toolbox/app-manifest` | React Nav 统一消费 stable 目录 | Homepage 与 Vanilla Nav 消费同一目录 | 名称、描述、图标和双语搜索关键词已集中；页面长文案仍由应用拥有 |

因此，当前是“共享导航/i18n 已部分落地，主题仍主要靠约定保持接近”，而不是完整设计系统。后续要通过版本化契约和自动一致性检查解决，不能只靠继续复制 CSS。

### 用户偏好

- 全局语言键：`toolbox-lang`
- 全局主题键：`toolbox-theme`
- 工具私有状态应使用 `toolbox.<app-id>.*` 命名，避免同域名下互相覆盖。
- 用户内容默认不得离开浏览器；外部请求必须显式说明并最小化。RateLens 是经维护者确认的自动实时数据例外，只请求公开 USD/CNY 汇率，不发送计算输入，并提供手动失败恢复。

## 五、质量基线

2026-07-13 在当前 `dev` 集成候选完成基线验证：

| 检查 | 结果 | 备注 |
|------|------|------|
| `pnpm build` | 通过 | 6 个 Vite 应用构建成功 |
| `pnpm test` | 通过 | 1,013 tests；数量不等同于覆盖率 |
| `pnpm test:browser` | 通过 | 六个应用均有生产态回归，覆盖共享壳、关键页面/路径、语言/主题、移动端与 console；完整截图矩阵仍待建设 |
| `pnpm lint` | 通过 | 当前参与根 lint 的应用为 0 warning |
| `pnpm check:privacy` | 通过 | 未发现实际密钥、真实绝对路径、内网/Tailscale IP；仍需人工复查 staged diff |
| `pnpm check:contracts` | 通过 | 应用隔离、包/base/output、依赖 catalog、storage、网络 allowlist 与 Nav 状态通过 |

当前最明显的质量缺口：

- 六个工具都已直接消费 `@toolbox/theme` runtime；页面 token 仍有 app-specific 映射，尚未形成完整单一事实源。
- SaneUnits 已移除重复偏好控件和本地色板，并有逐页生产 browser smoke；下一项设计系统缺口是六应用截图回归矩阵。

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
| [PLAN.md](./PLAN.md) | 长期愿景、路线图、新想法优先级、目标架构与 ADR |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | 主题、语言、导航和交互的规范性契约 |
| [NEW_TOOL.md](./NEW_TOOL.md) | “积木式”新增工具的开发手册 |
| [DEPENDENCIES.md](./DEPENDENCIES.md) | 工具链 catalog、升级边界与回滚方式 |
| [RELEASE.md](./RELEASE.md) | 固定的 dev→main→手动生产部署与回滚流程 |
| [TASKS.md](./TASKS.md) | 当前可执行任务与进度 |
| [../CHANGELOG.md](../CHANGELOG.md) | 已发布版本的结果记录 |
