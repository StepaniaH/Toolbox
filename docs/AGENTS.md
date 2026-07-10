# AGENTS.md — Toolbox 协作规范

> 适用于 Codex、Claude Code、OpenCode 等参与本仓库的 agent。
>
> 阅读顺序：本文 → [INDEX.md](./INDEX.md) → [PLAN.md](./PLAN.md) → [TASKS.md](./TASKS.md) → [DEPENDENCIES.md](./DEPENDENCIES.md)（涉及依赖时）→ 目标工具 README / 局部 AGENTS。

## 一、开始工作的硬门槛

任何编辑前必须执行并确认：

```bash
git status --short --branch
git branch --show-current
```

- `main` 是已部署的稳定分支，**绝不在 main 编辑或提交**。
- 日常工作在 `dev`；较大的单功能可以从 `dev` 派生 `feat/*`。
- 如果当前在 `main`，只有工作区干净时才能切换 `dev`；存在用户改动时先停止并说明。
- 不覆盖、不清理、不 stash 不属于当前任务的改动。
- 不自动合并 `main`、改 tag、force push 或部署；这些动作需要维护者明确授权。

## 二、仓库边界

```text
apps/        各工具应用；彼此是故障隔离单元
packages/    theme / nav / i18n 等稳定平台契约
docs/        架构、设计、开发手册和任务进度
deploy/      公开脚本与占位符模板
```

### 默认编辑权限

- 修改工具 A 时只编辑 `apps/A/`、对应测试与必要文档。
- 默认不修改 `packages/*`。共享包会影响多个应用，只有任务明确要求平台变更时才能编辑。
- 跨工具重构、共享包迁移和部署变更要在 [TASKS.md](./TASKS.md) 有独立任务，并分阶段提交。
- 禁止 `apps/A` import `apps/B`；共享业务逻辑必须经过评审后才可进入 `packages/*`。
- 全仓只使用根 `pnpm-lock.yaml`；不得在 app 目录生成或提交 `package-lock.json` / `yarn.lock`。
- React/Vite/Vitest/TypeScript 等受控工具链使用根 workspace catalog；升级和回滚按 [DEPENDENCIES.md](./DEPENDENCIES.md) 执行。

## 三、不可违反的产品红线

### 隐私

1. 默认纯客户端，不引入自有后端、数据库、登录或账号体系。
2. 不引入追踪、广告脚本、指纹、遥测或远端字体。
3. 默认不发起外部业务请求。确需实时数据时，必须用户主动触发、事前披露、最小发送并有本地 fallback。
4. 不提交真实 IP、端口、主机名、内部域名、VPN 地址、SSH 信息、部署路径、密钥、Token、个人邮箱、设备路径、日志或浏览器存储转储。
5. 公开文档只使用 `{{PLACEHOLDER}}`；不记录服务器供应商、机房位置或内部拓扑。

允许公开：公开站点、公开仓库、开源作者署名和通用示例。公开身份与私有运维信息必须明确区分。

### 稳定性

1. 新工具默认不得进入 stable 导航或生产部署。
2. 新工具只写自己的构建目录、路由和 storage namespace。
3. 共享包变更必须保持兼容或提供显式迁移，并跑全仓回归。
4. 不把未经各应用验证的“最新共享脚本”在运行时注入所有工具。
5. 不以一次大改同时迁移多个应用；逐个完成、验证、提交。

### 质量

1. 逻辑修改必须有测试；修 bug 先补复现测试。
2. 视觉修改必须验证 light/dark、zh/en、mobile/desktop 和 keyboard focus。
3. 共享包、部署或跨应用修改提交前必须通过 `pnpm build && pnpm test && pnpm lint`。
4. 五个应用均已进入根质量命令；Canvas、响应式或视觉修改仍必须增加对应浏览器 smoke，不能只依赖单元测试。
5. lint warning 会使门禁失败；不得用宽松退出码或 ignore 长期掩盖缺口。

## 四、已确认的长期设计偏好

这些是维护者明确给出的持久约束，所有后续视觉任务必须遵循：

- 全站主题、明暗、语言、设计风格和设计语言保持统一、稳定且优秀。
- 语言与主题只应由共享全局导航提供，不在工具内部重复一套。
- 右上角语言与主题按钮在鼠标 hover 时**不出现背景块、边框或选中框**；可以用颜色或图标反馈。
- 键盘 `:focus-visible` 仍必须有清晰 focus ring，不能因为移除 hover 框而牺牲无障碍。
- SaneUnits 当前与其他工具的壳层差异较大；后续要统一 token 与全局壳，但保留适合其多计算器结构的业务导航。

完整规范见 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)。如果收到新的持久设计反馈，同步更新本节和设计文档。

## 五、工作流程

### 5.1 建立事实

1. 读目标目录 README / AGENTS。
2. 用代码和配置核对文档，不假设旧任务描述仍正确。
3. 运行最小基线，记录已存在的 failure / warning。
4. 在 [TASKS.md](./TASKS.md) 标记任务为 `🔄 进行中`。

### 5.2 实现

1. 先写最小复现或契约测试。
2. 保持 diff 聚焦，不顺手格式化或重写无关文件。
3. 共享能力先确定契约，再迁移一个代表性应用。
4. 用户改动与 agent 改动重叠时，停下来说明，不擅自覆盖。

### 5.3 验证

```bash
# 单工具优先
pnpm --filter=@toolbox/<app> build
pnpm --filter=@toolbox/<app> test
pnpm --filter=@toolbox/<app> lint

# 跨应用 / 共享 / 发布门禁
pnpm check:privacy
pnpm check:contracts
pnpm build
pnpm test
pnpm lint
```

视觉任务还需按 DESIGN_SYSTEM 的发布前设计检查执行。新增工具按 [NEW_TOOL.md](./NEW_TOOL.md)。

### 5.4 同步进度

- 完成后将 TASKS 标为 `✅ 已完成` 并勾选真实通过的验收项。
- 未通过的项保持未勾选，写清阻塞，不把“已实现”当成“已验证”。
- 已发布结果进入 CHANGELOG；排查日志和本机输出不进入仓库。

## 六、Git 与阶段性提交

### 提交前

```bash
git status --short --branch
git diff --check
git diff
git diff --cached
git config --get user.email
pnpm check:privacy
```

必须逐行检查 staged diff：

- `.env`、私钥、Token、Authorization header。
- 公网/内网/VPN IP、端口、主机名和真实路径。
- `/Users/<name>/`、`/home/<name>/` 等个人路径。
- 未经维护者确认公开的邮箱、日志、截图元数据和调试转储。
- 新增外部 URL、fetch、第三方脚本和远端字体。

任何获准的运行时外部请求还必须登记在 `config/external-origins.json`；未登记或已失效的来源会被 `pnpm check:contracts` 拒绝。

提交邮箱可以是 GitHub noreply，也可以是维护者明确作为公开身份使用的 GitHub 邮箱；不得意外使用私人或工作邮箱。既有已发布历史的改写会改变 SHA，只能在维护者明确批准后执行。

### Commit 格式

```text
feat: ...
fix: ...
refactor: ...
style: ...
test: ...
docs: ...
chore: ...
```

- 一个提交对应一个可回滚阶段。
- 文档/护栏、平台契约、单应用迁移尽量分开提交。
- 不在 message 中写个人环境、服务器或内部项目代号。

## 七、新工具准入

不存在可直接假设可用的 `apps/_template`；以 [NEW_TOOL.md](./NEW_TOOL.md) 为当前事实源。模板或生成器只有在自己能持续 build/test 后才可成为准入路径。

核心准入条件：

1. Brief 明确输入、输出、假设、隐私、fallback 与 non-goals。
2. 独立目录、独立 base、独立 build output、独立 storage namespace。
3. 从第一天使用 theme/nav/i18n 契约，不复制共享实现。
4. 新工具默认 `hidden`；失败不能进入稳定导航或阻断现有工具。
5. 单工具与全仓门禁通过，视觉矩阵与隐私检查完成。
6. 未经维护者确认不合并 `main` 或部署。

新增 Vanilla 工具也优先使用 Vite 构建壳，以进入 workspace 和质量流水线。

## 八、部署边界

- CI 只允许从 `main` 的已验证提交部署。
- 手动脚本只应验证当前就是干净、同步的 `main`，不得静默切分支或忽略失败。
- 所有目标信息来自 gitignored `deploy/.env` 或 CI secrets；公开文件只描述变量名和占位符。
- 不在文档、commit、CI 日志中回显部署值。
- agent 不执行生产部署，除非维护者明确要求当前任务进行部署。

## 九、文档导航

| 需要了解 | 文档 |
|----------|------|
| 当前项目事实与质量基线 | [INDEX.md](./INDEX.md) |
| 架构方向与 ADR | [PLAN.md](./PLAN.md) |
| 主题、语言、导航与交互 | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) |
| 新工具开发流程 | [NEW_TOOL.md](./NEW_TOOL.md) |
| 当前任务和状态 | [TASKS.md](./TASKS.md) |
| 已发布结果 | [../CHANGELOG.md](../CHANGELOG.md) |
