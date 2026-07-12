# Toolbox — 当前任务与进度

> 最后更新：2026-07-12
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
- [x] 后续 P1.3 已让 Homepage 与 Monitor Choice 进入根 build/test/lint；当前质量基线见 [INDEX.md](./INDEX.md)。

---

## P0 — 隐私与发布安全

### P0.1 · RateLens 外部汇率请求透明化 `✅ 已完成`

**背景**：早期候选曾改为本地参考值和用户主动联网；维护者在 v0.2 明确要求当前汇率自动获取，避免未来多货币硬编码值产生大偏差。

**目标**：自动请求当前 USD/CNY，但持续披露固定第三方来源和用途，不发送本页输入；失败时不代入硬编码值，直接要求用户填写。

**验收**：

- [x] 首次加载自动请求 allowlist 中的公开汇率服务，UI 同步显示联网目标、用途和最小发送范围。
- [x] 两个来源失败后保持空汇率并自动展开手动输入，不回退 7.2 或其他未标日期值。
- [x] 手动填写会中止等待结果；用户手动值之后重试失败也不会被覆盖。
- [x] fetcher 有超时、fallback 和无真实网络的测试。
- [x] README/页面隐私表述与实际行为一致。
- [x] 桌面与 390px 手机布局、成功/失败网络路径、zh/en 切换和控制台错误检查通过。

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
- [x] 第三方 Actions 固定到官方版本标签当前对应的 commit SHA，版本注释保留可读性；后续升级必须显式改 SHA。
- [ ] 建立依赖许可证与高危漏洞检查，避免将完整环境信息上传第三方服务。

### P0.5 · ChronoSphere 中文日期区间结果顺序 `✅ 已完成`

**发现**：日期区间结果的绝对时间在中文下显示为“天 11 小时 0”，英文正常；中文参数化模板把单位错误地放在数字前，并被旧测试固定。

**验收**：

- [x] 中文结果按“11 天 0 小时”顺序显示，英文输出保持不变。
- [x] 先修正翻译回归测试，再验证日期区间实际结果卡。
- [x] zh/en、桌面/手机端结果均无拆行歧义或溢出。

### P0.6 · ChronoSphere 刷新后标签条分层闪烁 `✅ 已完成`

**发现**：部分刷新首帧中，标签条下半部分会暂时变亮，等待或滚动触发重绘后恢复。标签条位于保留 transform 的入场动画内，同时使用 fixed 多层背景和 `backdrop-filter`，形成浏览器分块合成伪影。

**验收**：

- [x] 应用根容器不再保留 transform 合成层，标签条不再使用局部背景模糊，页面背景随文档滚动。
- [x] 标签条改用现有主题的稳定 panel 表面，light/dark 视觉层级仍清楚。
- [x] 生产 browser smoke 固化 `transform: none`、无 tabs backdrop filter、无 fixed body background，并继续覆盖中文区间结果。

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

- [x] 禁止 `apps/*` 直接 import 或依赖另一个 app。
- [x] 校验 package name、route/base、目录和 build output。
- [x] 校验全局/应用 storage key 命名；active key 统一，旧 key 仅允许显式迁移 fallback。
- [x] 新 app 强制接入 theme/nav/i18n；现有三个 React app 的 theme 缺口暂列迁移基线。
- [x] 检查 app 自定义的 Theme/Language Toggle；全局偏好控件只允许由共享 NavBar 提供。
- [x] 检查未经 `config/external-origins.json` allowlist 的运行时外部 URL 或动态网络访问。
- [x] 静态副本迁移期间检查 NavBar 内容一致；两个应用进入 workspace 后已删除副本与过渡门禁。
- [x] 根命令 `pnpm check:contracts` 已在 CI 执行，并可继续扩展其他契约。

### P1.3 · 让静态应用进入 workspace `✅ 已完成`

**目标**：Homepage 与 Monitor Choice 使用 Vite 构建壳，但不重写业务逻辑。

- [x] Homepage 增加 package.json、Vite build、lint 与 5 条 smoke tests。
- [x] Homepage 保持根 URL、DOM 行为与根目录部署路径不变。
- [x] Homepage 通过 workspace 依赖消费 nav/theme/i18n，并删除手工运行时副本。
- [x] Monitor Choice 增加有序 Vite bootstrap、8 条 smoke/计算测试和 0-warning lint；Canvas 与 5 个 Tab 浏览器验证通过。
- [x] 两个应用逐个迁移；Homepage 独立验证并提交后再开始 Monitor Choice。

### P1.4 · 建立 app manifest `✅ 已完成`

- [x] 定义并测试 id/path/name/description/status schema。
- [x] Homepage、React NavBar、Vanilla NavBar 从同一数据源生成。
- [x] 支持 `hidden` / `preview` / `stable`，新工具默认 `hidden`。
- [x] manifest 只允许公开产品字段，不包含主机、部署或环境数据。
- [x] 删除三处手工维护工具列表的流程，并由 `check:contracts` 校验目录、路径与消费者。

### P1.5 · 统一依赖事实源 `✅ 已完成`

- [x] 所有 app 只使用 pnpm workspace 与根 `pnpm-lock.yaml`。
- [x] 删除 3 个 app 级 `package-lock.json`，更新仍在维护的 README/计划命令。
- [x] `check:contracts` 阻止 app 下重新加入 npm/yarn 锁文件。
- [x] 用 pnpm catalog 集中 React/Vite/Vitest/TypeScript 版本；保留已验证的 Vite 6 稳定线和 Vite 7/8 显式迁移线，迁移未改变实际解析版本。
- [x] [DEPENDENCIES.md](./DEPENDENCIES.md) 记录依赖/平台升级、锁文件审查与发布前后回滚方式。
- [x] `check:contracts` 拒绝受控工具链绕过 catalog 或组合不匹配。

---

## P2 — 设计系统收敛

### P2.1 · 修复 NavBar 控件状态 `🔄 进行中`

**已确认设计偏好**：所有工具右上角的语言与主题按钮，鼠标 hover 时不出现背景块、边框或选中框。

- [x] 移除 icon action 的 hover 背景，只保留颜色/图标反馈。
- [x] 恢复清晰的 `:focus-visible` 2px ring，不再用 `outline: none` 清空。
- [x] React 与 Vanilla CSS 以及两个静态部署副本完全一致。
- [ ] light/dark、mouse/keyboard/touch 验证通过。
- [x] 增加交互契约检查并接入 CI。

**待复核**：浏览器授权已恢复，生产 smoke 可运行；此项仍需补齐 mouse/keyboard/touch 的完整交互矩阵后再标记完成。

### P2.2 · SaneUnits 外壳对齐 `✅ 完成`

**发现**：SaneUnits 同时使用共享 NavBar 和 sidebar/mobile 中自有的主题、语言按钮；其空间、字体、控件和页面结构也与其他工具差异最大。

**原则**：统一全局壳与 token，不抹掉单位工具适合多页面导航的业务特色。

- [x] 移除 sidebar/mobile 的重复主题与语言控件，桌面和移动端只保留共享 NavBar 入口。
- [x] 用共享语义 token 对齐背景、卡片、边框、字体、圆角和控件状态；测试阻止重新复制色板。
- [x] 保留适合多计算器的业务导航，并与共享 NavBar 明确分层。
- [x] 建立生产浏览器基线，逐页验证 storage/network/video/power/about，并覆盖双主题、双语言与 390px 断点。
- [x] 本阶段未重写计算逻辑，只收敛全局壳、主题 token、语言元数据和回归验证。

### P2.3 · 逐个应用接入 `@toolbox/theme` `🔄 进行中`

- [x] 冻结 `@toolbox/theme` v1 模式、storage、DOM 与语义 token 契约，并补 CSS/runtime/pre-paint 包级测试。
- [x] ChronoSphere 先接入 v1 runtime 契约，消除 storage key、DOM 属性、默认值与 dark/light 校验的重复定义；保留 app 级 `system` 模式和现有 CSS。
- [x] RateLens 接入同一 runtime 契约，保留 legacy key pre-paint fallback 与 Tailwind 专属 token 映射。
- [x] SaneUnits 接入同一 runtime 契约；所有 app 现均由 `check:contracts` 强制直接依赖 theme/nav/i18n。
- [x] 以 SaneUnits 作为代表性 React 工具完成语义 token 试点，并通过逐页生产 browser smoke。
- [x] 首轮只迁移 SaneUnits，并保留其多计算器布局所需的 app-specific 映射层。
- [ ] React 工具完成后再迁移两个静态工具。
- [ ] 删除重复主题解析和 pre-paint 片段的手工维护。

### P2.4 · 视觉回归矩阵 `🔄 进行中`

- [x] 五个稳定应用均有生产 browser smoke；Homepage 已覆盖共享壳、四张工具卡、语言/主题、390px 单一工具入口、页脚与横向溢出。
- [x] 五应用共同消费共享壳浏览器契约，固定 1440px 居中导航轴、390px 唯一工具入口、Footer 方向和页面级横向溢出；全局 CSS 漂移会在根门禁中同时暴露。
- [x] 五应用共享壳在 1440/390px 均遍历中/英 × 暗/亮四组合并恢复初始状态；共享 i18n core 同步 `<html lang>`，防止可见语言与页面元数据分离。
- [x] 5 apps × light/dark × zh/en × desktop/mobile 的代表业务页 smoke：Homepage 卡片、Monitor 清晰度实验室、RateLens 主计算区、ChronoSphere 日期区间、SaneUnits 存储页。
- [x] 固定测试数据和 viewport：桌面/移动端采用 1440/390px，RateLens mock 汇率成功与失败，ChronoSphere 固定 Asia/Shanghai 时区及日期区间，其余应用沿用稳定默认输入。
- [ ] 先采用人工审核的基线截图，再评估像素 diff 阈值。
- [ ] PR 只保存有意义的差异，不把截图中的本地路径或个人数据入库。

### P2.5 · 共享 NavBar 信息架构升级 `✅ 已完成`

**范围**：维护者反馈 2、6、7、9；React 与 Vanilla 实现必须保持同一契约。

- [x] 品牌、桌面入口与控件字号略微增大，不影响 1024px 布局。
- [x] 语言改为独立图标 + hover/focus/tap 下拉列表，当前语言显示选中状态；语言名始终使用原生自称（`中文（简体）`、`English`），结构可扩展到更多语言。
- [x] 主题改为与当前状态一致的太阳/月亮图标，移除旋转并复位的 emoji 动画。
- [x] 手机端移除右侧重复工具目录按钮；左侧 Toolbox 菜单仍支持 tap、键盘和当前工具状态。
- [x] 双实现有契约测试，并通过 light/dark、zh/en、390/1440px 与 keyboard/touch 验证。

### P2.6 · 跨工具标题、图标与页脚统一 `✅ 已完成`

**范围**：维护者反馈 3、4、8；以 RateLens 标题层级为参考。

- [x] 应用图标进入单一事实源，首页卡片与每个工具大标题一致。
- [x] RateLens、ChronoSphere、Monitor Choice 与 SaneUnits 的标题标志统一采用 40px、12px 圆角、单色 15% 强调背景、无边框/渐变/阴影的共享容器，并由生产浏览器契约锁定。
- [x] 五个工具的大标题字号、字重、图标尺寸、简介间距和内容起始位置形成共享规范。
- [x] 页脚采用“左侧单行工具简介 + 右侧统一链接/声明”的共同骨架，窄屏自然堆叠。
- [x] 不把业务文案或应用布局耦合进共享平台包。

### P2.7 · SaneUnits 壳层与卡片层级二次收敛 `✅ 已完成`

**范围**：维护者反馈 1、5；保留多计算器业务导航。

- [x] 除首页外各业务页显著降低 card glow，层级与其他工具一致。
- [x] 纠正“把 Toolbox 贴到视口左边”这一错误理解，恢复共享 NavBar 的 1280px 居中内容轴。
- [x] 移除永久桌面 sidebar 和另一套 mobile header，改为应用标题、单一横向业务导航、居中内容和统一页脚的纵向骨架。
- [x] 保留多计算器业务导航；窄屏仅让导航条自身横向滚动，不造成页面级横向溢出。
- [x] storage/network/video/power/about 在 light/dark、zh/en、390/1440px 下通过浏览器回归。

---

## P3 — 测试与可维护性

### P3.1 · Monitor Choice 逻辑分层与测试 `✅ 已完成`

- [x] PPI/PPD、距离、FOV、带宽与桌深逻辑集中到 `calc.js`，并提供 ESM named exports；现有 Tab 继续通过 `window.Calc` 兼容桥运行。
- [x] 用独立 Node tests 覆盖主要边界、厘米/英寸和十进制 Gbps 公式；正常输入公式未改变。
- [x] 修复生产 CSS 相对 import 导致六个业务样式 404，并用构建测试禁止产物残留源码相对 `@import`。
- [x] 真实浏览器复核 5 个 Tab、7 个 Canvas、zh/en、light/dark 与 0 console error；后续将该流程固化为自动 browser smoke。
- [x] `pnpm test:browser` 固化生产资源、5 个 Tab、7 个 Canvas、zh/en、light/dark 和 console 检查，并在 CI 安装 Chromium 后执行。
- [x] 七个 Canvas 提供双语 accessible name，并关联同页动态文字结果；浏览器 smoke 防止翻译 key 或描述关系回归。

### P3.2 · Homepage smoke 与链接契约 `✅ 已完成`

- [x] 所有 stable app 卡片存在且 URL 唯一。
- [x] zh/en 切换、light/dark 切换与 375px 移动菜单可用。
- [x] 公开链接使用安全的 `rel` 属性。
- [x] 新 app 未标记 stable 时不出现在主入口。

### P3.3 · 清理当前 warning 与测试噪音 `✅ 已完成`

- [x] 修复 SaneUnits 3 条 lint warning。
- [x] 修复 RateLens 倍率预设泄漏原始翻译 key，并补渲染回归断言。
- [x] 处理测试中的 Node localStorage ExperimentalWarning。
- [x] 根 lint 对 warning 采用明确策略，避免 warning 永久积累。
- [x] 记录各 app test 数量时不把数量当覆盖率。

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
- [x] 合并 main 不自动上线；GitHub Actions 只允许从手动选择的 main ref 部署，备用脚本也强制干净且同步的 main。

### P5.2 · 平台包版本策略 `⏳ 待开始`

- [ ] 采用 Changesets 或等价机制记录 theme/nav/i18n 变更。
- [ ] 定义 compatible / breaking 规则与迁移期。
- [ ] 共享包变更能明确列出需要回归的应用。
- [ ] 不允许运行时加载未经应用验证的“最新共享脚本”。

---

## 建议池（尚未排期）

- ChronoSphere：核对最大 timezone chunk 的实际首屏加载与缓存表现。
- RateLens：模型价格硬编码应记录数据更新时间与来源，但不要为更新数据引入隐式追踪。
- Monitor Choice：减少 inline style，逐步建立可测试的渲染/计算边界。
- SaneUnits：页面内存在大量业务与布局代码集中在 `App.tsx`，设计对齐后再按领域拆分，避免同时动 UI 与计算。
- 全站：统一 favicon、404、错误页和离线提示，但 PWA/Service Worker 应在路由与缓存失效策略明确后再做。
