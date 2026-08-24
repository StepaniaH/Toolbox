# Toolbox — 当前任务与进度

> 最后更新：2026-08-24
>
> 这里只保留当前与下一阶段工作。已发布结果见 [CHANGELOG.md](../CHANGELOG.md)，架构理由见
> [PLAN.md](./PLAN.md)。不保存过程日志、聊天摘要、真实服务器或个人环境信息。

状态：`⏳ 待开始` · `🔄 进行中` · `⛔ 阻塞` · `✅ 已完成`

## 工作流规则

- `main` 是已发布稳定线；本地 `dev` 是唯一开发分支，不推送远端；远端只有 `origin/main`。
- 全部实现以聚焦提交落在 `dev`；对照 `main` 的审核、合并、push、打 tag 是四个互相独立的
  维护者授权。发布由 `vX.Y.Z` tag 触发 Release 工作流，生产部署仍需手动确认。
- 维护者只描述自然语言需求；开发 Agent 自动生成 Brief 和安全默认值，写入应用双语 README，
  完成聚焦提交后停止，不 push、不打 tag。
- 共享包、跨应用与部署变更必须跑 privacy/contracts/release/build/test/lint/browser 全仓门禁。
- 完成项的用户可见结果在发布时进入 CHANGELOG；本文件不长期保存已结束的实施过程。

## P0 — 安全与发布

### P0.1 · 依赖安全与许可证 `✅ 已完成`

- [x] `check:licenses` 离线扫描全部安装包的 license 字段并对照已审阅的宽松许可允许清单。
- [x] CI 执行 `check:audit`（生产依赖、high 起报）；仅向 registry 提交依赖名与版本。
- [x] 保持 Actions 固定 SHA、Node 24 兼容运行时、只读权限、Turborepo telemetry opt-out 和显式生产部署。

### P0.2 · dev → main 晋级清单 `⏳ 待开始`

- [ ] CI 全绿：privacy/contracts/build/test/lint/browser。
- [ ] CHANGELOG、版本与受影响应用同步，并记录可回滚 commit。
- [ ] `main` 只接受维护者明确晋级；合并不自动部署，生产仍需手动确认。

### P0.3 · 双目标静态生产发布 `✅ 已完成`

- [x] 将完整门禁后的多应用 `dist/` 组装为单一、可审计的静态站点 artifact。
- [x] 保留 9929 VPS 的 Tailscale、SSH、rsync 与现有 Secrets，并增加 Cloudflare Pages Direct Upload。
- [x] 两个目标只允许从 `main` 手动选择发布，使用 `production` environment 和独立并发保护。
- [x] 文档只公开正式站点域名；VPS 目标、端口、路径和 Cloudflare 凭据继续使用占位符或 Secrets。

### P0.4 · 分支模型切换与 tag 发布流水线 `🔄 进行中`

- [x] 删除远端 `dev`，远端只保留 `origin/main`；本地 `dev` 成为唯一开发分支。
- [x] AGENTS / NEW_TOOL / RELEASE / skill 同步单线开发与 tag 发布模型。
- [x] 新增 `check:release`：根版本、`TOOLBOX_RELEASE` 与 CHANGELOG 最新小节强制一致，
  并支持 CI 中校验当前 tag。
- [x] 新增 Release 工作流：push `v*` tag 触发全仓门禁，通过后从 CHANGELOG 小节创建
  GitHub Release。
- [x] CI push 触发面收敛到 `main`；生产部署保持从 `main` 手动触发。
- [ ] 首个 tag 在生产服务器迁移完成后由维护者创建；在此之前不推送任何 tag。

## P1 — 新工具积木与审核隔离

### P1.1 · 分支、skill 与交接契约 `✅ 已完成`

- [x] 根 `AGENTS.md` 把 `main`/`dev`/`newdev/<tool-id>` 权限放在 Agent 首个入口。
- [x] [NEW_TOOL.md](./NEW_TOOL.md) 固化 Brief、平台 API、双语关键词、隐私、测试、单工具预览、
  handoff 与合并后删除规则。
- [x] 仓库内 `$develop-toolbox-tool` skill 在编辑前强制检查 branch/dirty state，并明确不拥有
  merge、stable 晋级或部署权限。
- [x] skill 接受普通产品描述，自动推导 id/Brief/技术栈/隐私/双语/测试，不要求维护者填表。
- [x] `newdev/*` 默认本地提交、不 push；集成模型只在明确授权后本地合并并按要求 push `dev`。
- [x] 独立前向测试确认普通工具需求会自动形成可执行 Brief、安全默认值和本地候选交接，不产生多余提问或远端 push。
- [x] `check:contracts` 要求所有 app 提供 dev/build/preview/test/test:browser/lint、平台依赖、
  base/output、storage、网络 allowlist 与双语搜索关键词。
- [x] 根 `pnpm test:browser` 自动发现带 browser suite 的 workspace，不维护硬编码 app 名单。

### P1.2 · 可运行生成器 `✅ 已完成`

- [x] 提供 Vanilla TypeScript 与 React TypeScript 两种最小变体（`scripts/new-app.mjs`）。
- [x] 自动创建 package/base、hidden manifest 注册、双语 README（含 Brief）与测试骨架。
- [x] 生成器自身有 dry-run、冲突保护与 out-of-tree 自测；模板消费 theme/nav/i18n/manifest 契约。
- [x] 真实脚手架演练通过 build/test/lint/browser 全链路后清理，宣布为正式入口。

### P1.3 · 新工具展示单一事实源 `✅ 已完成`

- [x] 将 Homepage 卡片文案收敛进 manifest 的 `presentation` 展示契约。
- [x] 首页从 manifest 渲染卡片并在启动时注册文案；删除最后一份 id/path 映射。
- [x] `check:contracts` 要求 stable 工具提供双语文案与 badges；业务长文案仍归 app 所有。

### P1.4 · FormTran 本地候选 `✅ 已完成`

- [x] 完成并集成浏览器本地图片批量转换、GIF 合成、文本/标记互转、命名、预览、知识库与 ZIP 下载候选。
- [x] 双语、主题、响应式、键盘、隐私、资源预算和生产浏览器门禁均已建立；历史明细保留在 `v0.2.5`/`v0.2.6` changelog，不在任务表重复维护。

### P1.5 · FormTran 本地文件工作台扩展 `🔄 进行中`

- [x] 文件首页收敛为一个内容入口，递归接收拖放文件夹；按文件族分组，支持单项/勾选/整组/全选范围、实时总览、单项弹窗和专用工作台返回路径。
- [x] PDF 已从轻量估算推进到按需完整解析，开放多文件合并、逐页拆分、提取、删除、完整顺序重排与选中页旋转；加密、文件/总量/页数/拆分输出均有硬上限。
- [x] 防路径穿越/重名/压缩炸弹的 ZIP 清单和选择性提取已经开放。
- [x] HEIC/HEIF 获得 64 MB 上限的按需本地解码；CSV/TSV/XLSX 获得独立值转换、公式注入防护、宏/公式不执行和表格资源上限。
- [x] 共享选择器、浅色层级与页面结构使用边界、列表和表格，持续降低同层级 Card 密度。
- [x] 专用工作台生成结果进入共享输出队列，支持处理结果回收、单项/勾选/同类/全局重命名与单独/统一/ZIP 导出，并有 200 项 / 1 GB 结果预算。
- [x] 首页「清空任务」统一重置输入、结果与已流转工作台；PDF 收敛为队列/信息/页面处理三级流程，并在执行前提供页码预设和结果顺序预览。
- [ ] 分阶段实现裁剪/拼接等图片编辑、GIF 专项、PDF 可视渲染/转图片、JSON/YAML/XML 数据和其他压缩格式；每阶段独立测试、
  文档和本地提交，重型解析器需先通过依赖、内存与安全评估。

### P1.6 · CryptoLab 本地密码学工具 `✅ 已完成`

- [x] 已在独立 `newdev/crypto-lab` 完成、审核并按维护者授权合并到 `dev`；公开晋级已由 P1.7 的独立门禁完成。
- [x] 覆盖编码、哈希/HMAC、对称/非对称密码学、JWT 检查、Secure Share 二维码和「关于」页；私钥不进入二维码、URL、storage 或网络。

### P1.7 · CryptoLab 公开候选 `✅ 已完成`

- [x] 修复 Secure Share 上游输入变化后的结果失效，增加公钥指纹与敏感状态一键清除。
- [x] 分离 RSA-OAEP 加密与 RSA-PSS 签名工作流，并在运算前执行明文资源预算。
- [x] 明确 JWT 解码、签名验证与标准时效声明之间的边界。
- [x] 完成双语、主题、响应式、键盘、隐私与全仓门禁后解除隐藏。

## P2 — 导航、发现与设计系统

### P2.1 · Toolbox 首页链接与工具搜索 `✅ 已完成`

- [x] `🧰 Toolbox` 本体直接链接 `/`；独立箭头负责 keyboard/tap 展开，desktop 保留 hover。
- [x] 品牌、语言、主题 hover 只做颜色反馈，无背景选中框；focus-visible 保留 2px ring。
- [x] 工具菜单顶部支持本地搜索与无结果状态，不产生网络请求。
- [x] manifest 维护 zh/en keywords；React 与 Vanilla Nav 使用当前语言名称、描述和关键词。
- [x] 契约与 Homepage browser smoke 覆盖首页 href、英文同义词命中、无结果和移动展开。

### P2.2 · SaneUnits 子页面标题去重 `✅ 已完成`

- [x] SaneUnits 主标题保留唯一 canonical icon。
- [x] storage/network/video/power/about 子页面标题不再重复应用 icon。
- [x] production browser smoke 逐路由防止重复图标回归。

### P2.3 · 语义 token 收敛 `✅ 已完成`

执行顺序与验收：每个应用独立提交，迁移后跑该应用 build/test/lint/browser 与全仓门禁。

- [x] 七个应用直接消费 `@toolbox/theme` runtime；SaneUnits、FormTran、CryptoLab 已只使用语义 token。
- [x] 平台前置：`@toolbox/theme` 拆出 `tokens.css`（调色板/语义/基础令牌），`styles.css` 保持
  tokens + 元素基线；既有消费者不变。
- [x] Homepage：引入 `styles.css`，`css/variables.css` 只保留派生别名；内联 pre-paint 由
  单测强制与 `prePaintScript()` 逐字一致。
- [x] RateLens：只引 `tokens.css`；Tailwind/shadcn 映射全部由共享别名派生，原始色号清零；
  legacy 键迁移 pre-paint 保留并有守卫测试。
- [x] ChronoSphere：引入共享样式与 canonical pre-paint；模式写入私有键，共享键只存解析值并
  完成一次性迁移（ADR-12），847 条测试覆盖读写边界。
- [x] Monitor Choice：自建 ThemeManager 收敛为 runtime 适配器（系统跟随/画布重绘/旧按钮同步），
  调色板改为 token 派生别名，画布插图常量集中声明；NavBar 切换经单一包装触发重绘。
- [x] 每个应用迁移后验证 light/dark × zh/en × desktop/mobile × keyboard。

### P2.5 · 平台双实现等价契约 `✅ 已完成`

- [x] `check:contracts` 增加成对断言：footer 对（manifest 查找、release 标签、安全外链）与
  i18n 对（共享词表、语言 API 面）逐项对称。
- [x] 偏好键卫生：平台包内存储引用与 *_KEY 常量必须精确等于共享契约值，漂移即失败；
  交互级等价继续由七应用视觉矩阵覆盖。

### P2.6 · 文档防腐与 smoke 分级 `✅ 已完成`

- [x] NEW_TOOL 明确分级门禁：单应用任务默认只跑该应用 build/test/lint/browser +
  privacy/contracts/release；共享包、跨应用或发布改动才要求全仓 browser。
- [x] INDEX 的测试数量改为不易腐朽的表述（记录基线日期与命令，不再声称实时数字）。

### P2.4 · 视觉回归基线 `🔄 进行中`

- [x] 七应用 production smoke 覆盖 1440/390px、zh/en、light/dark、代表业务页、共享壳与溢出。
- [x] `pnpm shots` 以固定时钟、阻断跨域、reduced motion 捕获 8 页 × 2 主题 × 2 语言 ×
  2 视口共 64 张基线，存于 docs/screenshots 供人工审核。
- [ ] 维护者审核基线后决定像素 diff 阈值与执行时机。
- [ ] 主题族（gruvbox/solarized）与新增语言纳入截图矩阵。

### P2.7 · Settings 设置应用 `✅ 已完成`

- [x] `apps/settings` 完成双语实现：Appearance（模式/语言）与 Homepage（可见性/顺序/
  上限/重置）两节，键盘与移动端达标（窄屏纵向堆叠）。
- [x] 新共享包 `@toolbox/prefs` 定义 `toolbox-homepage-prefs`（schema/hiddenIds/order/
  limit），防御式归一化 + contractVersion 漂移守卫；Homepage 经 prefs 管线渲染。
- [x] 两套 NavBar 增加齿轮入口（manifest 解析路径），进入 React/Vanilla 成对断言。
- [x] 应用暂保持 `hidden`，随下次发布审核晋级 stable；导航齿轮在晋级后即指向真实路由。

### P2.8 · 主题族机制与首批双模式族 `⏳ 待开始`

依赖：P2.7 提供选择界面；建议 P2.4 截图基线先覆盖默认主题。

- [x] theme 契约 v2（包 1.1.0）：`data-theme-family` 属性、`toolbox-theme-family` 键、
  族清单与 `prePaintScript()` 双属性解析；六个应用内联片段逐字更新。
- [x] tokens.css 族块只覆盖原始 `--ctp-*` 层，语义别名经 var() 自动跟随；gruvbox、
  solarized 双模式族落地，契约测试锁定原始色覆盖与默认族逐字节不变。
- [x] WCAG 对比度门禁进入 theme 契约测试，并推动 solarized 双模式文字阶梯加深。
- [x] Settings Appearance 提供色板选择器（双模式渐变预览）；NavBar 明暗按钮保持只切模式。
- [x] 八应用 build/test/lint/browser 全量通过。

### P2.9 · 语言注册表与 zh-Hant 试点 `⏳ 待开始`

依赖：P2.7 提供选择界面。

- [x] i18n 包新增语言注册表（code、nativeName、zhName、覆盖状态）与 Settings 的
  Apple 式两行选择器；副显示名由 `Intl.DisplayNames` 运行时生成，无手工译名矩阵。
- [x] 覆盖度门禁：未覆盖语言不出现在选择器；注册表版本进 contracts 漂移守卫。
- [ ] `zh-Hant` 全量翻译覆盖（七应用 + Homepage + Settings 文案与 manifest 双语
  关键词），完成后将注册表 covered 置 true 并扩展 key 完整性测试矩阵。

## P3 — 性能与可维护性

### P3.1 · 合成层第一轮优化 `✅ 已完成`

- [x] 移除 Monitor Choice 多个 Canvas/卡片/粘性面板上的 18–20px backdrop blur。
- [x] 用不透明 Catppuccin surface 保留信息层级，降低滚动与 Canvas 更新时的 GPU 重绘成本。
- [x] 构建测试拒绝重新引入 `backdrop-filter`，production browser smoke 验证五个 Tab 与七个 Canvas。

### P3.2 · 可解释性能预算 `🔄 进行中`

- [x] `measure-perf` 从构建产物生成 raw/gzip 体积表与最大 chunk，写入
  docs/PERFORMANCE.md 基线；CI 在 build 后输出报告（仅报告，不做硬阈值）。
- [ ] 优先核对 ChronoSphere timezone lazy chunk（122.8k gzip）与 RateLens 首包
  （113.6k gzip）的真实加载/缓存，再决定拆包策略。
- [ ] 交互延迟与缓存行为的可解释基线。

### P3.3 · 结构性维护 `🔄 进行中`

SaneUnits 拆分：App.tsx（约 1,400 行）已确认只含视图编排——计算、格式化与选项表全部在
`lib/units`，语言状态在 `lib/i18n`。按以下边界拆分，每阶段独立提交并跑单应用门禁：

- [x] 阶段一：抽 `lib/router.tsx`（路径助手 + NavLink + useAppNavigation）、
  `lib/persisted-url-state.ts`（useSyncedState 与各页 URL 编解码，整体保持“URL 恒反映
  状态”不变量）、`components/ui.tsx`（PageHeader/Panel/FieldRow/NumberInput/ShareLink 等
  展示原语）。
- [x] 阶段二：`NETWORK_PRESETS` 移入 `lib/units.ts`；六个页面连同各自 DEFAULTS 与
  decode/encode 对拆入 `pages/*.tsx`，App.tsx 收敛为壳层与路由映射（约 90 行）。
- [x] 迁移为纯代码搬移：不改文案（含 NetworkPage 既有双语三元分支）、不改存储键与路由
  名；deep-link 刷新由 browser smoke 守护。
- [ ] Monitor Choice 继续减少 inline style，建立更清晰的渲染 lifecycle/cleanup 边界。
- [ ] RateLens 为模型价格记录公开来源与更新时间，不为更新引入追踪或隐式代理。

## P4 — 平台版本与体验补全

### P4.1 · 平台包版本策略 `⏳ 待开始`

- [ ] 用 Changesets 或等价机制定义 compatible/breaking、迁移期与受影响 app 清单。
- [ ] 禁止 stable 应用在运行时加载未经该应用验证的“最新共享 UI”。

### P4.2 · 统一错误与离线体验 `⏳ 待开始`

- [ ] 统一 favicon、404、顶层错误页和离线提示。
- [ ] PWA/Service Worker 仅在路由和缓存失效策略明确后评估，不能以缓存旧工具换取表面速度。
