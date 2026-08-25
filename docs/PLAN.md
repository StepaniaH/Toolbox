# Toolbox — 架构方向、长期路线图与决策

> 本文回答“项目要走向哪里、为什么、一个新想法该排在什么位置”。
>
> 当前事实见 [INDEX.md](./INDEX.md)，近期可执行事项见 [TASKS.md](./TASKS.md)，已发布结果见
> [CHANGELOG.md](../CHANGELOG.md)。PLAN 不保存逐步施工日志，TASKS 不替代长期方向。

## 一、长期愿景

Toolbox 要成为一个可以长期维护、持续加入新工具的隐私优先工具平台，而不是一批碰巧放在
同一仓库里的页面。

理想状态下，维护者只需要描述“想解决什么问题”。实现 Agent 自动继承分支隔离、主题、
语言、导航、图标、文档、隐私和测试；发布审核对照 `main` 独立进行，由维护者控制合并、
推送与 tag。用户则始终获得快速、清楚、一致、无需账号且尽量离线可用的工具。

所有路线都必须同时守住四个不变量：

1. **隔离**：一个候选工具失败，不能改变稳定工具或生产产物。
2. **一致**：全局主题、语言、导航、基础交互和无障碍不能由每个工具重新发明。
3. **隐私**：输入默认留在浏览器；联网必须最小、透明、可恢复且经过明确批准。
4. **可维护**：新增能力不能用长期复制、隐式耦合或无法回滚的升级换取短期速度。

## 二、目标架构

```text
自然语言产品需求
  ↓ develop-toolbox-tool / scripts/new-app.mjs
本地 dev 聚焦提交
  ├─ 独立业务代码、双语 README（含 Brief）、测试与 build output
  ├─ theme / nav / i18n / manifest 稳定契约
  └─ privacy / contracts / release / unit / browser 自动门禁
  ↓ 维护者审核 main...dev 并明确授权
main 稳定线（merge commit）
  ↓ 授权后 push origin/main，CI 全绿
vX.Y.Z tag（版本准备提交保证三处版本一致）
  ├─ Release 工作流完整门禁并生成 GitHub Release
  └─ 手动确认后生产部署
```

### 应用边界

每个 `apps/<app-id>` 是故障隔离单元：

- 独立拥有业务逻辑、页面、测试、README、production base 与 `dist/`。
- 禁止 import 其他 app；共享能力只能来自稳定的 `packages/*`。
- 私有 storage 使用 `toolbox.<app-id>.*`；全局只共享 theme/lang。
- 新工具默认 `hidden`，未审核候选不进入主导航或部署。
- Vanilla、React、Canvas/WebGL 都使用 Vite 构建壳并进入同一质量流水线。

### 平台边界

| 平台能力 | 长期职责 | 不应拥有 |
|---|---|---|
| `@toolbox/theme` | pre-paint、模式、语义 token、字体/形状/状态基础 | 单工具视觉或业务布局 |
| `@toolbox/nav` | 唯一全局导航、偏好入口、应用 icon、页脚与响应式壳 | 工具业务导航和业务状态 |
| `@toolbox/i18n` | 全局语言状态、HTML lang、插值与 React/Vanilla 接口 | 每个工具全部业务文案 |
| `@toolbox/app-manifest` | id、route、名称、描述、关键词、icon、公开状态 | 环境、部署主机或业务逻辑 |

共享包在仓库内使用 `workspace:*`，但设计上仍按版本化公共 API 对待。破坏性变化必须有迁移
路径、受影响应用清单和全仓回归，不能因为“同仓库”就忽略兼容成本。

## 三、当前所处阶段

已经成立的基础：

- 七个工具独立构建，根 build/test/lint/browser 自动发现 workspace。
- theme/nav/i18n/manifest 已同时覆盖 React 与 Vanilla 工具。
- 共享导航、双语关键词搜索、canonical icon、页脚和偏好状态已有生产浏览器门禁。
- privacy/contracts 能检查应用隔离、base/output、受控依赖、storage、网络 allowlist 和脚本面。
- `main`、本地 `dev` 与手动生产部署的权限边界已经明确；远端只保留 `origin/main`，
  发布由 `vX.Y.Z` tag 记录。
- 新工具 skill 已能从自然语言需求生成内部 Brief，并默认停在本地 `dev`。

仍未完全成立的“积木化”：

- 没有经过实战验证的 Vanilla/React 生成器或模板。
- Homepage 虽从 manifest 读取 stable apps，仍需手工维护 `CARD_PRESENTATION`，新增稳定工具还
  不是“只加 app 目录和一条 manifest”。
- 共享层提供壳和契约，但尚不是成熟的基础表单/结果组件库；目前也不应为预测未来过早抽象。
- 各 app 仍有语义 token 映射、i18n adapter 和局部类型声明差异。
- browser smoke 很强，但还没有人工审核过的固定截图基线和性能趋势预算。

## 四、长期路线图

路线图描述持续方向，不承诺具体日期。只有被选入近期执行的事项才进入 TASKS。

### 方向 A：真正低摩擦的新工具流水线

目标：维护者只描述需求，Agent 完成剩余工程约束。

- 可运行生成器 `scripts/new-app.mjs` 是新工具的正式入口，提供 Vanilla TypeScript 与
  React TypeScript 两个最小变体。
- 生成器负责 package/base、hidden manifest 注册、双语 README（含 Brief）、测试骨架与
  browser smoke，并具备 dry-run、冲突保护和自测；分支操作仍由维护者流程控制。
- 将 Homepage 卡片展示字段收敛进 manifest 展示契约，消除最后一份工具目录映射。
- 开发全部发生在本地 `dev`；不为“像团队协作”而引入无意义远端分支。

### 方向 B：稳定而克制的平台能力

目标：新工具继承一致体验，但共享层不吞掉业务自由。

- 逐个收敛 app-specific 语义 token、theme pre-paint 和 i18n adapter。
- 平台样式分两层：`tokens.css` 只承载调色板、语义别名与基础令牌；`styles.css` 在其上叠加
  元素基线。受 Tailwind 等全局样式约束的应用只引入 tokens 层。
- 各应用内联 pre-paint 片段必须与 `toggle.js#prePaintScript()` 输出逐字一致，由自动化检查
  强制；应用可在其后追加自己的 legacy 键迁移逻辑，但共享键的读取与写入值域不变。
- 扩展主题模式（如跟随系统）不得以非契约值写入共享 `toolbox-theme` 键；共享键只保存解析
  后的 `dark|light`，模式本身保存在应用私有命名空间（ADR-12）。
- 为平台包建立 compatible/breaking 规则、迁移期和版本记录。
- 只有三个以上稳定工具出现相同语义需求后，才考虑共享表单、结果、空状态或错误组件。
- 保持 React/Vanilla API 行为等价；等价性先由 contracts 成对断言守住结构与消费面，交互级
  等价继续依赖视觉矩阵，出现真实漂移证据后再升级为自动化渲染比对。
- 平台扩展必须可回滚，不能让运行中应用消费未经自身验证的“永远最新”共享 UI。

### 方向 C：性能、可靠性与无障碍成为预算

目标：工具数量增加后仍然快、稳、可验证。

- 为每个 app 建立首屏 JS/CSS、最大 chunk 的可解释基线：`scripts/measure-perf.mjs` 从
  构建产物生成体积表并写入 `docs/PERFORMANCE.md`，CI 输出对照；超预算先说明后处理，
  不设不可解释的硬失败阈值。交互延迟与缓存行为待真实证据后再补测量。
- 优先测量 RateLens 首包与 ChronoSphere timezone lazy chunk，再决定拆包或数据加载策略。
- 维护 light/dark × zh/en × desktop/mobile × keyboard 的代表业务矩阵。
- 建立人工审核截图基线：`scripts/capture-screens.mjs` 以固定时钟、固定预览数据在
  1440/390 视口捕获 stable 应用关键页的 light/dark × zh/en 矩阵，基线入库存档；像素
  diff 阈值在基线经人工审核后再引入。
- 持续检查焦点、语义 HTML、Canvas 文本替代、reduced motion、损坏 storage/query 和异常恢复。
- 统一顶层错误、404、离线说明；Service Worker 只有在缓存失效策略可靠后才考虑。

### 方向 D：工具增多后的发现与组织

目标：几十个工具时仍然找得到、理解得快，而不是把首页变成卡片墙。

- manifest 继续作为名称、路径、描述、icon、关键词和状态的事实源。
- 根据真实工具数量和搜索日志之外的隐私安全信号，评估类别、标签、相关工具、最近使用或收藏。
- 搜索优先保持本地、确定性和当前语言语义；没有证据时不引入远端搜索、用户画像或复杂排序。
- 首页从“固定展示”演进为可扩展目录，但要保留清楚的信息层级和首屏性能。
- preview/experimental 工具需要明确状态，不与 stable 工具混淆。

### 方向 E：可信数据与联网例外治理

目标：需要实时/外部数据的工具仍然符合隐私优先承诺。

- 默认离线计算；外部请求必须是产品核心需要，而不是开发方便。
- 每个例外登记来源、用途、最小发送、超时、fallback、数据更新时间和测试 adapter。
- 对模型价格、汇率、时区等会过期的数据建立公开来源与更新时间，而不是静默硬编码。
- 未来若出现多个数据工具，再评估可审计的数据更新流水线；不预先建设自有后端。

### 方向 F：安全发布与长期维护

目标：单人项目也拥有清楚、低风险、可恢复的发布秩序。

- 保持本地 dev 聚焦提交 → 维护者审核 → main 合并 → push 触发 CI → tag 发布 → 手动生产
  部署的多层确认。
- 版本事实源唯一：根 `package.json`、`TOOLBOX_RELEASE` 与 CHANGELOG 由 `check:release`
  强制一致，tag 与版本不符时 Release 工作流失败。
- 平台包版本策略：契约版本（THEME_CONTRACT_VERSION 等）升级必须同步包版本——兼容扩展
  升 minor，破坏性变更升 major 并在包 README 记录迁移说明与受影响应用清单；由
  DEPENDENCIES.md 约束，contracts 检查契约版本与包版本的同步声明。
- 建立依赖许可证与高危漏洞检查：`check:licenses` 离线扫描 node_modules 的 license
  字段并对照允许清单；`check:audit` 在 CI 内执行生产依赖漏洞审计，仅上传依赖名与版本。
- 统一 404 与离线体验：assemble 生成根级双语 404 页（内联主题，无外部资源）与站点
  favicon；根级 Service Worker 采用“哈希资产 cache-first、导航 network-first、离线回退
  页”策略，注册脚本由 assemble 注入，应用代码不感知。
- 为每次 release 记录版本、受影响 app、验证结果与可回滚 commit。
- 统一 favicon、错误页和部署产物清单；长期考虑可复现构建与静态资产完整性。
- 不用 force push、历史改写或自动部署换取表面简化。

### 方向 G：设置中心与个性化

目标：把“每个用户的 Toolbox”从固定形态升级为可配置形态，同时不破坏隐私与一致体验。
参考 Port Light 的 Settings 面板（主题色板选择器、网格密度、locale 菜单）与 Apple 式
语言选择列表（主显示为该语言自称，副显示为当前界面语言译名）。

分三个互相依赖的阶段推进，全部落在共享平台层，任何应用不得自建第二套设置入口：

1. **Settings 应用**（`apps/settings`，`/settings/`）：Appearance（主题模式、主题族、
   语言）与 Homepage（展示哪些工具、每行/总数密度、展示顺序）两节起步。设置页是语言与
   外观的唯一入口；全局 NavBar 右侧只保留指向设置页的齿轮（原“导航快捷按钮”方案已由
   维护者撤销，AGENTS 设计偏好同步更新）。
2. **主题族机制**：`data-theme` 保持 `dark|light` 契约不变，新增 `data-theme-family`
   属性切换调色板族；共享键 `toolbox-theme-family` 默认 `catppuccin`。pre-paint 同时解析
   两个属性。首批只收双模式族（catppuccin + gruvbox + solarized），单模式族待浅色配套
   方案明确后再评估。
3. **语言注册表**：i18n 包提供数据驱动的语言注册表 `{ code, nativeName }`，二级显示名用
   `Intl.DisplayNames(当前语言)` 生成，不手工维护译名表。选择器按 Apple 式两行列表渲染。
   新语言按翻译覆盖度逐步开放，未覆盖语言不出现在选择器；`toolbox-lang` 值域随注册表
   版本扩展，首个试点为 `zh-Hant`。

Homepage 个性化偏好存入共享命名空间（`toolbox-homepage-prefs`，JSON，形状由契约校验），
由 Settings 写入、Homepage 与 Nav 消费；顺序先作用于首页卡片，导航菜单排序作为后续扩展。
全部偏好仅存本机 localStorage，不引入任何同步或账号。

### 前端本地格式转换器候选队列

这组工具都以“文件不离开浏览器”为默认前提，按浏览器原生能力、可验证性和体积成本分阶段实现：

| 候选 | 首要能力 | 主要边界 / 实现前提 |
|---|---|---|
| FormTran | 本地文件工作台；统一任务入口已开放图片/GIF/文本、HEIC/HEIF、CSV/TSV/XLSX、PDF 页面与 ZIP 提取 | 首页负责识别、分组、范围、总览与共享结果；各文件族使用隔离工作台与资源预算，不自动处理源文件 |
| Structured Data extensions | FormTran 已实现 CSV/TSV/XLSX 值转换；后续再评估 JSON / NDJSON / YAML / XML | 后续大文件优先流式解析；类型推断、数字精度、实体与公式注入必须显式治理 |
| CryptoLab | dev stable 候选已开放 Base64、URL/HTML/Hex、哈希、HMAC、AES/ChaCha20、用途分离的 RSA、JWT 时效检查与 Secure Share | 公钥指纹需通过独立可信渠道核对；私钥不进入二维码、URL、storage 或网络，浏览器能力缺失时明确失败 |
| Text & Markup Converter | 已作为 FormTran 独立 Tab 实现 TXT / Markdown / Org-mode / RST / AsciiDoc / HTML 互转、结构解析与预览 | 使用轻量 AST 保留标题、段落、列表、链接、引用、代码块和分隔线；明确提示方言语法无法完整往返 |
| Audio Converter | WAV / MP3 / AAC / Opus / FLAC 与裁切、码率 | 优先 WebCodecs，缺失编码器再评估可审计的本地 WASM 与包体预算 |
| Video Converter | 容器/编码、分辨率、帧率、音轨与片段 | 依赖 WebCodecs/WASM、内存与长任务治理；先做能力检测和取消/恢复 |
| Archive Converter | ZIP / TAR / GZIP 解包、重打包与清单预览 | 防止 zip bomb、路径穿越、超大内存占用和不可见文件误打包 |
| Document & Ebook Converter | EPUB / HTML 文档包及开放电子书格式 | 保留语义、目录和资源引用；与轻量标记文本转换分开，PDF/Office 高保真转换不承诺纯浏览器首版 |
| Icon & Asset Packager | SVG / PNG / ICO、favicon 与多尺寸资源包 | SVG 必须清理脚本与外部引用；输出可复核的尺寸和 manifest |

候选进入 TASKS 前必须形成独立 Brief、隐私与资源预算。FormTran 统一承载“本地文件任务”心智：
首页负责一个入口、识别、分组、操作范围、总体/单项预览与工作台流转；图片、GIF、PDF、文本数据
与压缩包继续使用隔离业务模块，并按需加载重型能力；处理结果回到首页共享队列，统一完成范围命名、
预览和直接/ZIP 导出。音视频等显著增加包体、长任务与编解码风险的领域仍优先保持独立应用。任何能力都绝不
为覆盖率静默上传文件。详细边界由候选内的 `docs/FILE_WORKBENCH.md` 维护。

## 五、规划视野

| 视野 | 当前重点 | 进入条件 |
|---|---|---|
| Now | 设置中心（方向 G 阶段 1）；主题族机制与首批双模式族；语言注册表与 zh-Hant 试点 | 方向 G 三阶段按依赖顺序推进 |
| Next | 截图回归基线（多主题前置条件）；平台版本策略；统一错误/离线体验；依赖安全 | Now 的契约稳定且重复成本出现 |
| Later | 导航菜单排序；更强工具分类与发现；PWA 离线；性能预算 | 工具数量或重复场景提供真实证据 |
| Explore | 单模式主题族、更多语言、收藏/最近使用、本地搜索 | 不牺牲隐私、性能和维护成本 |

“Later/Explore”不是承诺。新的脑洞可以先进入 PLAN 的方向或候选池，只有确认价值、边界和
验证方式后才进入 TASKS。

## 六、新想法的优先级判断

任何新工具或平台想法先回答以下问题：

1. **用户价值**：解决的问题是否真实、频繁、难以用现有工具完成？
2. **覆盖范围**：只改善一个边角，还是能降低多个工具/未来工具的成本？
3. **战略解锁**：是否直接推进“自然描述即可新增工具”、一致体验或可信发布？
4. **证据与可验收性**：是否能写出明确输入输出、成功条件和回归测试？
5. **隐私与风险**：是否新增网络、敏感数据、供应链或跨应用故障半径？
6. **长期成本**：依赖、数据更新、兼容、文档和视觉维护会持续消耗多少？
7. **可逆性**：能否局部上线、隐藏、回滚或独立删除？

优先级原则：

- 隐私、稳定性和数据正确性缺陷优先于新功能。
- 能解锁后续多个工具的窄平台能力，通常高于单页装饰优化。
- 明确高频用户价值的独立工具，可以高于“为了架构漂亮”的重构。
- 高维护、低证据、不可逆或依赖自有后端的想法先进入 Explore，不直接编码。
- 只有至少三个真实消费者，才把重复能力提升为共享 UI；否则允许适度局部重复。

规划流转：

```text
新脑洞
  → 在 PLAN 中定位方向、价值、风险和证据
  → 选择 Now/Next/Later/Explore
  → 只有进入 Now 且验收明确时写入 TASKS
  → 完成并发布后从 TASKS 移除，结果进入 CHANGELOG
```

## 七、架构决策记录（ADR）

### ADR-1：保留 monorepo

所有工具与平台能力保留在同一仓库，以获得原子变更、统一 CI 和契约检查；隔离由应用边界
与部署路径保证，不靠分仓。

### ADR-2：使用同域路径路由

工具位于统一域名下的独立路径，降低静态部署和共享偏好成本；代价是严格管理 base、route、
storage 和全局 CSS。

### ADR-3：默认纯客户端

默认不引入自有后端、数据库或账号。实时外部数据必须明确披露、固定来源、最小发送并有
手动/离线恢复。

### ADR-4：共享稳定契约，不共享业务页面

`packages/*` 只承载跨工具基础能力。业务状态、领域文案和页面结构留在 app 内，避免为了
表面复用扩大故障半径。

### ADR-5：所有新工具使用 Vite 构建壳

框架可以不同，但 workspace、依赖、base、hashed assets、build/test/lint/browser 入口必须一致。

### ADR-6：共享能力在构建期固定

稳定应用不在运行时加载未经自身验证的最新共享脚本；一致性不能以同时破坏所有工具为代价。

### ADR-7：工具链使用根 catalog 与显式迁移线

React、Vite、Vitest、TypeScript 等版本由根 workspace 管理；升级必须逐应用验证并能回滚。

### ADR-8：新工具候选默认只在本地（已被 ADR-9 取代）

原方案为每个新工具维护本地 `newdev/<tool-id>` 候选分支。单机维护下分支往返的审核成本
高于其隔离收益，已由 ADR-9 的单线模型取代。

### ADR-9：单一本地开发线

`dev` 是唯一开发分支，只存在于本机，不推送远端。全部实现以聚焦提交落在线上；对照
`main` 的审核、合并、推送与打 tag 是四个互相独立的维护者授权。远端只保留 `origin/main`。

### ADR-10：tag 是发布事实源

发布以 `main` 上的 `vX.Y.Z` annotated tag 记录。push tag 触发 Release 工作流重跑完整
门禁并从 CHANGELOG 生成 GitHub Release；生产部署仍需从 `main` 手动触发。回滚通过
revert commit 加新的 patch tag 完成，不改写历史、不移动已有 tag。

### ADR-11：React 与 Vanilla 平台双实现视为一个版本化契约

`@toolbox/nav`、`@toolbox/i18n`、`@toolbox/theme` 同时提供 React 与 Vanilla 入口是长期
状态，不是迁移中间态。两套 API 必须行为等价：一侧变更必须同步另一侧并有等价断言，
契约版本一起升级；不以“代码只剩一份”为目标。

### ADR-12：共享偏好键只保存契约值域

`toolbox-theme` 与 `toolbox-lang` 是跨应用契约，值域分别为 `dark|light` 与 `zh|en`。
共享键在任何时刻都只保存解析后的契约值；读取到非法或遗留值时按契约回退，不扩大故障半径。

> 2026-08-25 更新：设置页成为外观偏好的唯一写入方后，本 ADR 的“应用私有模式”部分被
> 撤销——应用直接跟随共享 `toolbox-theme`，不再用私有键覆盖它（chrono-sphere 的私有
> theme-mode 层已移除，其遗留键保留一次性迁移）。共享键仍绝不保存 `system` 等非契约
> 值；系统跟随只属于无显式选择时的回退行为。


### ADR-13：主题族用独立属性，模式契约保持不变

`data-theme` 的 `dark|light` 值域、`toolbox-theme` 键与全部既有选择器保持不动；调色板族
通过新增的 `data-theme-family` 属性与 `toolbox-theme-family` 键表达。这是兼容性扩展：
默认族 `catppuccin` 下渲染结果与现状逐像素一致。族清单、键名与属性名进入 theme 契约
v2；pre-paint 片段同步解析两个属性，非法族回退默认族。

### ADR-14：语言注册表数据驱动，显示名用运行时生成

i18n 包维护唯一的语言注册表（code、nativeName、覆盖状态）。选择器主行显示 nativeName
（静态数据，每语言一份），副行用 `Intl.DisplayNames` 按当前界面语言生成译名，不为语言
名称维护手工翻译矩阵。`toolbox-lang` 的合法值域由注册表推导并随契约版本扩展；未达到
覆盖标准的语言不对用户开放。

## 八、平台成熟的完成定义

当以下条件持续成立时，才可以说 Toolbox 真正具备“积木式扩展”能力：

- 维护者只需描述产品需求，不需要讲分支、框架、主题、语言、隐私或测试模板。
- 一个新工具主要新增自己的目录与一条完整 manifest 记录，不再修改多个工具目录映射。
- 候选失败不会影响 stable app，默认不会进入远端、导航、main 或生产。
- light/dark、zh/en、desktop/mobile、keyboard、privacy 和错误恢复自动验证。
- 平台升级有兼容规则、受影响范围、迁移路径和回滚点。
- 工具增多后仍可发现、性能可解释、数据来源可信、发布必须人工确认。
