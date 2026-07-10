# Toolbox — 当前任务与进度

> 最后更新：2026-07-10
>
> 本文只保留当前和下一阶段任务。已发布结果进入 [CHANGELOG.md](../CHANGELOG.md)，架构理由进入 [PLAN.md](./PLAN.md)。不得在任务记录中保存真实服务器、网络或个人环境信息。

## 使用规则

- 所有日常修改发生在 `dev`；功能分支从 `dev` 派生。
- 开始任务：标记 `🔄 进行中`；完成：标记 `✅ 已完成` 并勾选验收项。
- 一个提交尽量只完成一个可回滚阶段，提交前同步本文。
- 共享包改动、跨应用改动和部署改动必须跑全仓门禁。
- `main` 的合并和部署由维护者明确确认，不属于普通任务的隐含权限。

状态：`⏳ 待开始` · `🔄 进行中` · `⛔ 阻塞` · `✅ 已完成`

## v0.1 健康基线

2026-07-10 在 `dev` 与 `v0.1` 同起点完成：

- [x] `pnpm build`：3 个 Vite 应用构建通过。
- [x] `pnpm test`：910 tests 通过（ChronoSphere 843、RateLens 55、SaneUnits 12）。
- [x] `pnpm lint`：通过，SaneUnits 有 3 条 warning。
- [x] 当前内容与全部 5 个提交做敏感模式扫描；未发现实际密钥、真实绝对路径、内网/Tailscale IP。
- [ ] Homepage 与 Monitor Choice 尚未进入根 build/test/lint，不能把上述结果理解为全站覆盖。

---

## P0 — 隐私与发布安全

### P0.1 · RateLens 外部汇率请求改为主动选择 `✅ 已完成`

**发现**：页面加载会自动请求第三方汇率 API/CDN。没有上传表单内容，但访问者 IP、请求头和访问时间会到达第三方，与“全部本地、零第三方访问”的对外表述不一致。

**目标**：默认完全本地；实时汇率由用户主动获取并在操作前披露目标与用途。

**验收**：

- [x] 首次加载不产生业务第三方网络请求。
- [x] 默认参考汇率或手动输入可完成所有计算。
- [x] “获取实时汇率”由用户点击触发，并显示简短隐私说明。
- [x] fetcher 有超时、fallback 和无真实网络的测试。
- [x] README/页面隐私表述与实际行为一致。
- [x] 桌面与 390px 手机布局、zh/en 切换、控制台错误检查通过。

外部 URL 全仓 allowlist 属于 P1.2 的通用门禁，不与本功能提交耦合。

### P0.2 · 加固手动部署脚本 `✅ 已完成`

**发现**：脚本当前尝试 `checkout main` 并忽略失败；在脏工作区或切换失败时可能继续从错误分支部署。公开 `.env.example` 还含具体的非标准端口和内部网络提示，不符合最小披露原则。

**目标**：部署脚本只验证，不替用户切分支；只允许干净且已同步的 `main`。

**验收**：

- [x] 非 `main`、detached HEAD、dirty worktree 立即失败。
- [x] 更新只允许 `git pull --ff-only`，不自动 merge/rebase。
- [x] 端口、主机和路径全部来自 gitignored env；公开模板只含通用占位符。
- [x] 将 `deploy/.env.example` 清理为纯占位符，脚本对缺失字段给出不回显值的错误。
- [x] `bash -n` 与 ShellCheck 通过；在 `dev` 实测会在加载 env、构建或联网前拒绝执行。

### P0.3 · Git 与文档隐私卫生 `🔄 进行中`

- [x] 从当前架构/任务文档移除供应商、位置、内部拓扑和真实部署细节。
- [x] 明确允许公开信息与禁止入库信息的边界。
- [x] 对当前树和既有提交做不回显值的敏感模式扫描。
- [x] 按维护者决定继续使用其 GitHub 主页已公开的提交邮箱，不强制 noreply。
- [x] 当前树的部署模板已移除具体 SSH 端口和内部网络提示。
- [ ] `v0.1` 历史模板曾包含具体端口（未包含密钥、真实主机或 IP）；若该值仍在使用，由维护者在服务器侧决定是否轮换，不为此自动改写 Git 历史。
- [x] CI 增加无第三方依赖的 privacy scan；扫描结果只输出类别和文件名，不回显疑似 secret 原文。

**决策**：该邮箱属于维护者主动公开的项目身份，不视为隐私缺陷，不改写 v0.1 历史。仍禁止意外混入其他私人或工作邮箱。

### P0.4 · CI / 工具链最小遥测面 `🔄 进行中`

- [x] CI 明确设置 Turborepo telemetry opt-out。
- [x] GitHub Actions 默认权限收紧为 `contents: read`，checkout 不持久化 token。
- [ ] 第三方 Actions 固定到审核过的 commit SHA 或使用受控更新策略。
- [ ] 建立依赖许可证与高危漏洞检查，避免将完整环境信息上传第三方服务。

---

## P1 — 架构护栏与单一事实源

### P1.1 · 重建项目认知与架构文档 `✅ 已完成`

- [x] [INDEX.md](./INDEX.md) 按真实代码记录应用、共享包与质量基线。
- [x] [PLAN.md](./PLAN.md) 明确“应用隔离 + 版本化契约 + 自动门禁”方向。
- [x] [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) 固化主题、语言、导航与交互规则。
- [x] [NEW_TOOL.md](./NEW_TOOL.md) 提供新工具 playbook。
- [x] 将 v0.1 迁移过程从当前任务板移除；发布结果由 CHANGELOG 保存。

### P1.2 · 实现 `check:contracts` `🔄 进行中`

**目标**：把文档中可机器判断的规则变成根命令和 CI 门禁。

- [ ] 禁止 `apps/*` 直接 import 另一个 app。
- [ ] 校验 package name、route/base、目录和 build output。
- [ ] 校验全局/应用 storage key 命名。
- [ ] 检查 theme/nav/i18n 依赖与重复偏好控件。
- [ ] 检查未经 allowlist 的运行时外部 URL。
- [x] 检查 NavBar 静态共享文件副本内容（迁移完成前的过渡门禁）。
- [x] 根命令 `pnpm check:contracts` 已在 CI 执行，并可继续扩展其他契约。

### P1.3 · 让静态应用进入 workspace `⏳ 待开始`

**目标**：Homepage 与 Monitor Choice 使用 Vite 构建壳，但不重写业务逻辑。

- [ ] 为两个应用增加 package.json、build、lint、smoke scripts。
- [ ] 保持现有 URL、DOM 行为与部署路径不变。
- [ ] 通过 workspace 依赖消费 nav/theme，删除手工副本。
- [ ] 迁移时逐个应用完成、验证、提交；不得同时大改两者。

### P1.4 · 建立 app manifest `⏳ 待开始`

- [ ] 定义并测试 id/path/name/description/status schema。
- [ ] Homepage、React NavBar、Vanilla NavBar 从同一数据源生成。
- [ ] 支持 `hidden` / `preview` / `stable`，新工具默认 `hidden`。
- [ ] manifest 不包含主机、部署或环境数据。
- [ ] 删除三处手工维护工具列表的流程。

### P1.5 · 统一依赖事实源 `⏳ 待开始`

- [ ] 确认所有 app 只使用 pnpm workspace 与根 `pnpm-lock.yaml`。
- [ ] 删除 app 级 `package-lock.json`，更新 README 中的 npm 指令。
- [ ] 校准 React/Vite/Vitest/TypeScript 版本策略，避免无意的多版本组合。
- [ ] 记录依赖升级与平台升级的回滚方式。

---

## P2 — 设计系统收敛

### P2.1 · 修复 NavBar 控件状态 `🔄 进行中`

**已确认设计偏好**：所有工具右上角的语言与主题按钮，鼠标 hover 时不出现背景块、边框或选中框。

- [x] 移除 icon action 的 hover 背景，只保留颜色/图标反馈。
- [x] 恢复清晰的 `:focus-visible` 2px ring，不再用 `outline: none` 清空。
- [x] React 与 Vanilla CSS 以及两个静态部署副本完全一致。
- [ ] light/dark、mouse/keyboard/touch 验证通过。
- [x] 增加交互契约检查并接入 CI。

**待复核**：本轮浏览器服务器启动因环境授权额度不足被拒绝；没有绕过。自动契约、build/test/lint 可继续通过，真实浏览器矩阵待额度恢复后补做再标记完成。

### P2.2 · SaneUnits 外壳对齐 `⏳ 待开始`

**发现**：SaneUnits 同时使用共享 NavBar 和 sidebar/mobile 中自有的主题、语言按钮；其空间、字体、控件和页面结构也与其他工具差异最大。

**原则**：统一全局壳与 token，不抹掉单位工具适合多页面导航的业务特色。

- [ ] 移除 sidebar/mobile 的重复全局偏好控件。
- [ ] 用共享语义 token 对齐背景、卡片、边框、字体、圆角和控件状态。
- [ ] 保留适合多计算器的业务导航，但与共享 NavBar 明确分层。
- [ ] 建立迁移前视觉基线，逐页验证 storage/network/video/power/about。
- [ ] 不在一次提交中同时重写计算逻辑。

### P2.3 · 逐个应用接入 `@toolbox/theme` `⏳ 待开始`

- [ ] 先冻结 theme token 契约并补包级测试。
- [ ] 选一个代表性 React 工具试点，确保无视觉回归。
- [ ] 每次只迁移一个工具并保留 app-specific token 映射层。
- [ ] React 工具完成后再迁移两个静态工具。
- [ ] 删除重复主题解析和 pre-paint 片段的手工维护。

### P2.4 · 视觉回归矩阵 `⏳ 待开始`

- [ ] 5 apps × light/dark × zh/en × desktop/mobile 的关键页面 smoke。
- [ ] 固定测试数据和 viewport，避免动态汇率等不稳定输入。
- [ ] 先采用人工审核的基线截图，再评估像素 diff 阈值。
- [ ] PR 只保存有意义的差异，不把截图中的本地路径或个人数据入库。

---

## P3 — 测试与可维护性

### P3.1 · Monitor Choice 逻辑分层与测试 `⏳ 待开始`

- [ ] 从 7k+ 行静态代码中优先提取 PPI/PPD、距离、带宽等纯函数。
- [ ] 为边界值、单位、舍入和非法输入补 Vitest。
- [ ] 为 5 个 tab 与 Canvas 初始化增加浏览器 smoke。
- [ ] Canvas 提供可读的文本结果或摘要。

### P3.2 · Homepage smoke 与链接契约 `⏳ 待开始`

- [ ] 所有 stable app 卡片存在且 URL 唯一。
- [ ] zh/en 切换、light/dark 切换与移动菜单可用。
- [ ] 公开链接使用安全的 `rel` 属性。
- [ ] 新 app 未标记 stable 时不出现在主入口。

### P3.3 · 清理当前 warning 与测试噪音 `⏳ 待开始`

- [ ] 修复 SaneUnits 3 条 lint warning。
- [ ] 处理测试中的 Node localStorage ExperimentalWarning。
- [ ] 根 lint 对 warning 采用明确策略，避免 warning 永久积累。
- [ ] 记录各 app test 数量时不把数量当覆盖率。

### P3.4 · 性能预算 `⏳ 待开始`

- [ ] 为首屏 JS/CSS、最大 chunk 和图片设置可解释预算。
- [ ] 关注 ChronoSphere timezone chunk 与 RateLens 首包，不盲目以拆包数量优化。
- [ ] CI 报告趋势，超预算需说明而非静默通过。

---

## P4 — “积木式”新工具能力

### P4.1 · 可运行的 `_template` 或生成器 `⏳ 待开始`

- [ ] 模板本身能 build/test/lint/smoke，不是无人维护的文件副本。
- [ ] 支持 Vanilla TypeScript 与 React 两种最小变体。
- [ ] 自动写入 package name、base、manifest、README 与测试骨架。
- [ ] 默认接入 theme/nav/i18n 和 Error Boundary/错误恢复。
- [ ] 默认 `hidden`，生成完成不会改变生产导航。

### P4.2 · 仓库内开发 skill `⏳ 待开始`

**前置**：P4.1 与 `check:contracts` 稳定后再做，避免把未验证流程固化。

- [ ] 从 [NEW_TOOL.md](./NEW_TOOL.md) 提炼 agent 可执行步骤。
- [ ] skill 必须先检查分支、dirty state、AGENTS 和 app brief。
- [ ] skill 不持有部署权限，不自动改 `main` 或发布。
- [ ] 在一个试验工具上完整演练并记录失败恢复。

---

## P5 — 发布治理

### P5.1 · dev → main 晋级清单 `⏳ 待开始`

- [ ] CI 全绿：build/test/lint/contracts/smoke/privacy。
- [ ] CHANGELOG 与应用版本同步。
- [ ] 记录可回滚 commit 与受影响应用。
- [ ] main 只接受 fast-forward/PR 晋级，不直接开发。
- [ ] 部署只接受 main commit 或 release tag。

### P5.2 · 平台包版本策略 `⏳ 待开始`

- [ ] 采用 Changesets 或等价机制记录 theme/nav/i18n 变更。
- [ ] 定义 compatible / breaking 规则与迁移期。
- [ ] 共享包变更能明确列出需要回归的应用。
- [ ] 不允许运行时加载未经应用验证的“最新共享脚本”。

---

## 建议池（尚未排期）

- ChronoSphere：核对最大 timezone chunk 的实际首屏加载与缓存表现。
- RateLens：模型价格硬编码应记录数据更新时间与来源，但不要为更新数据引入隐式追踪。
- RateLens：倍率预设按钮当前会显示 `preset.rate0.6` / `preset.rate1.1` 原始翻译 key，应改用不含点号的稳定 key 并补渲染测试。
- Monitor Choice：减少 inline style，逐步建立可测试的渲染/计算边界。
- SaneUnits：页面内存在大量业务与布局代码集中在 `App.tsx`，设计对齐后再按领域拆分，避免同时动 UI 与计算。
- 全站：统一 favicon、404、错误页和离线提示，但 PWA/Service Worker 应在路由与缓存失效策略明确后再做。
