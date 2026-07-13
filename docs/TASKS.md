# Toolbox — 当前任务与进度

> 最后更新：2026-07-13
>
> 这里只保留当前与下一阶段工作。已发布结果见 [CHANGELOG.md](../CHANGELOG.md)，架构理由见
> [PLAN.md](./PLAN.md)。不保存过程日志、聊天摘要、真实服务器或个人环境信息。

状态：`⏳ 待开始` · `🔄 进行中` · `⛔ 阻塞` · `✅ 已完成`

## 工作流规则

- `main` 是已部署稳定线；`dev` 是维护者审核集成线。
- 新工具只在从干净 `dev` 创建的 `newdev/<tool-id>` 实现，开发 Agent 不得修改或合并
  `dev`/`main`。完整流程见 [NEW_TOOL.md](./NEW_TOOL.md)。
- 维护者只描述自然语言需求；开发 Agent 自动生成 Brief 和安全默认值，在本地候选分支完成
  聚焦提交后停止，默认不 push。审核/合并/push `dev` 分别需要明确授权。
- 共享包、跨应用与部署变更必须跑 privacy/contracts/build/test/lint/browser 全仓门禁。
- 完成项的用户可见结果在发布时进入 CHANGELOG；本文件不长期保存已结束的实施过程。

## P0 — 安全与发布

### P0.1 · 依赖安全与许可证 `⏳ 待开始`

- [ ] 增加可复现的许可证清单与不兼容许可证门禁。
- [ ] 增加高危依赖漏洞检查，避免把完整环境信息上传第三方服务。
- [ ] 保持 Actions 固定 SHA、只读权限、Turborepo telemetry opt-out 和显式生产部署。

### P0.2 · dev → main 晋级清单 `⏳ 待开始`

- [ ] CI 全绿：privacy/contracts/build/test/lint/browser。
- [ ] CHANGELOG、版本与受影响应用同步，并记录可回滚 commit。
- [ ] `main` 只接受维护者明确晋级；合并不自动部署，生产仍需手动确认。

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

### P1.2 · 可运行生成器 `⏳ 待开始`

- [ ] 提供 Vanilla TypeScript 与 React TypeScript 两种最小变体。
- [ ] 自动创建本地 `newdev/<tool-id>`、package/base、hidden manifest、双语 README、handoff 与测试骨架；默认不 push。
- [ ] 生成器自身有 dry-run、冲突恢复、build/test/lint/browser 测试；不是无人维护的复制目录。
- [ ] 先在一个实验工具分支演练，再宣布为正式入口。

### P1.3 · 新工具展示单一事实源 `⏳ 待开始`

- [ ] 将 Homepage 的 `CARD_PRESENTATION` 字段收敛进 manifest 或稳定展示扩展契约。
- [ ] 新 stable 工具不再需要手改首页和导航中的第二份 id/path 映射。
- [ ] 保持业务长文案归 app 所有，避免 manifest 演变成页面内容仓库。

### P1.4 · FormTran 本地候选 `✅ 已完成`

- [x] 在 `newdev/image-converter` 完成纯客户端单图/文件夹批量转换、预览与 ZIP 导出。
- [x] 支持 PNG/JPEG/WebP 输出、浏览器主流图片输入、缩放与透明背景处理。
- [x] 提供模板和可视化正则命名、冲突消解、格式知识点与边界提示。
- [x] 完成双语、主题、响应式、键盘、隐私和单工具/全仓门禁后交接审核。
- [x] 优化跳过文件明细、转换结果预览、可点击命名变量、正则引导与独立知识库 Tab。
- [x] 完成品牌、首屏上传反馈、普通/高级命名分层、分 Tab 隐私说明与文件/ZIP 下载优化。
- [x] 将首屏上传/队列统一为等宽等高布局，并修正浅色主题高级正则面板层级。
- [x] 增加独立 GIF 合成 Tab，支持 2–100 帧排序、画布、时序、循环、本地编码、预览与下载。
- [x] 完成 Text & Markup Tab，支持 TXT/Markdown/Org/RST/AsciiDoc/HTML 的结构解析、互转、检查、预览与下载。
- [x] 将知识库重整为图片、动画、文本标记三级分类导航，为后续格式领域保留扩展位。
- [x] 修复 GIF LZW 跨位宽边界导致真实画布仅解码顶部窄条的问题，并加入大帧底部像素回归。
- [x] 增加 GIF 清空队列、文本多文件批量队列/清空/ZIP，以及主题原生格式与下载菜单。
- [x] 降低 GIF、文本和知识库的 Card 密度，改用分区边界、列表、展开行和专项对比表建立信息层级。

### P1.5 · FormTran 本地文件工作台扩展 `🔄 进行中`

- [x] 将定位升级为文件转换、压缩、编辑、拆分、合并、编码、解析与信息查看的统一入口，
  并固化能力状态、隐私、性能和恶意输入边界。
- [x] 增加默认文件首页：支持文件/文件夹拖入、本地轻量识别、按文件族分组和推荐工具，不自动执行。
- [x] 将兼容图片、GIF 与文本文件显式流转到已有工作台，并为图片提供可解释、可继续编辑的常用预设。
- [x] 识别 JPG/JPEG/PNG/WebP/AVIF/GIF/SVG/BMP/TIFF/HEIC/ICO、PDF、TXT/Markdown/HTML/
  JSON/YAML/XML/CSV 与 ZIP；不把“已识别”误写成“当前浏览器可完整处理”。
- [ ] 分阶段实现图片编辑与信息、GIF 专项、PDF 页面、文本数据和压缩包工具；每阶段独立测试、
  文档和本地提交，重型解析器需先通过依赖、内存与安全评估。

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

### P2.3 · 语义 token 收敛 `🔄 进行中`

- [x] 五个应用直接消费 `@toolbox/theme` runtime；SaneUnits 已完成代表性语义 token 迁移。
- [ ] 逐个迁移 Homepage、Monitor Choice、ChronoSphere、RateLens 的 app-specific token 映射。
- [ ] 删除各应用重复主题解析和 pre-paint 片段，只保留必要兼容 fallback。

### P2.4 · 视觉回归基线 `🔄 进行中`

- [x] 五应用 production smoke 覆盖 1440/390px、zh/en、light/dark、代表业务页、共享壳与溢出。
- [ ] 生成并人工审核固定数据截图，再决定像素 diff 阈值。
- [ ] 截图只保存有意义差异，不包含本地路径、个人数据或动态第三方响应。

## P3 — 性能与可维护性

### P3.1 · 合成层第一轮优化 `✅ 已完成`

- [x] 移除 Monitor Choice 多个 Canvas/卡片/粘性面板上的 18–20px backdrop blur。
- [x] 用不透明 Catppuccin surface 保留信息层级，降低滚动与 Canvas 更新时的 GPU 重绘成本。
- [x] 构建测试拒绝重新引入 `backdrop-filter`，production browser smoke 验证五个 Tab 与七个 Canvas。

### P3.2 · 可解释性能预算 `⏳ 待开始`

- [ ] 记录每个 app 首屏 JS/CSS、最大 chunk、图片与初次交互基线。
- [ ] 优先核对 ChronoSphere timezone lazy chunk 与 RateLens 首包的真实加载/缓存，而非盲目拆包。
- [ ] CI 报告趋势；超预算需要说明和审核，不用不可解释的硬阈值阻塞小型合理变化。

### P3.3 · 结构性维护 `⏳ 待开始`

- [ ] SaneUnits 按计算领域拆分过大的 `App.tsx`，保持 UI 与计算迁移分阶段。
- [ ] Monitor Choice 继续减少 inline style，建立更清晰的渲染 lifecycle/cleanup 边界。
- [ ] RateLens 为模型价格记录公开来源与更新时间，不为更新引入追踪或隐式代理。

## P4 — 平台版本与体验补全

### P4.1 · 平台包版本策略 `⏳ 待开始`

- [ ] 用 Changesets 或等价机制定义 compatible/breaking、迁移期与受影响 app 清单。
- [ ] 禁止 stable 应用在运行时加载未经该应用验证的“最新共享 UI”。

### P4.2 · 统一错误与离线体验 `⏳ 待开始`

- [ ] 统一 favicon、404、顶层错误页和离线提示。
- [ ] PWA/Service Worker 仅在路由和缓存失效策略明确后评估，不能以缓存旧工具换取表面速度。
