# Toolbox 新工具开发守则

> 本文是新工具开发与 `dev` 集成审核的规范性事实源。Agent 开始工作时必须显式调用
> [`$develop-toolbox-tool`](../.agents/skills/develop-toolbox-tool/SKILL.md)；skill 负责执行顺序，
> 本文负责长期契约。共享视觉细则见 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)。

## 1. 分支模型：实现与集成严格分离

```text
main                 已部署稳定线，只接受维护者批准的发布
  ↑
dev                  维护者审核与集成线，不直接开发新工具
  ↑ review only
newdev/<tool-id>      单个新工具的唯一实现分支，必须从 dev 创建
```

新工具开发的硬门槛：

1. 在任何编辑前运行 `git status --short --branch` 与
   `git branch --show-current`。
2. 只有工作区干净且当前为 `dev` 时，才可执行
   `git switch -c newdev/<tool-id> dev`。
3. 分支名中的 `<tool-id>` 必须与 `apps/<tool-id>`、package name 和路由一致，使用
   kebab-case。
4. 新工具的代码、测试、依赖、manifest 候选和交接文档全部只提交到该
   `newdev/<tool-id>`。
5. 开发 Agent 不得向 `dev` 或 `main` 提交、合并、rebase、改 tag 或部署，也不得
   自动将工具状态提升为 `stable`。
6. `dev` 上的审核与合并由维护者使用高能力模型单独完成。候选分支落后时，开发
   Agent 只报告差异，不自行把 `dev` 合入候选分支，除非维护者明确要求。

本仓库自身的架构、文档、共享包维护可以在维护者明确要求时发生于 `dev`；上述限制
专门约束“新工具实现”，避免较弱模型污染集成线。

## 2. 开发前先提交一页 Brief

在 `apps/<tool-id>/NEW_TOOL_HANDOFF.md` 顶部维护以下内容：

```yaml
id: kebab-case-id
route: /kebab-case-id/
name: ProductName
problem: 一个明确的用户问题
inputs: 用户提供什么
outputs: 工具返回什么
assumptions: 会改变结果的假设
privacy: 保存什么、是否联网、数据流向
offline_fallback: 无网络或外部服务失败时如何工作
non_goals: 本分支明确不做什么
acceptance: 3-8 条可验证结果
```

Brief 不能说明“输入如何变成输出”时，先澄清产品问题，不用堆页面隐藏不确定性。

## 3. 技术与目录契约

默认使用 Vite 构建壳：简单表单/计算器优先 Vanilla TypeScript，复杂状态优先
React + TypeScript，Canvas/WebGL 仍必须通过 Vite 独立构建。

```text
apps/<tool-id>/
├── src/
├── public/                       # 可选，仅本地资产
├── tests/browser-smoke.mjs
├── index.html
├── package.json
├── vite.config.*
├── README.md                     # 面向用户的英文长期文档
├── README.zh-CN.md               # 面向用户的中文长期文档
└── NEW_TOOL_HANDOFF.md           # 候选分支临时交接文档，合并时删除
```

必须满足：

- package name 为 `@toolbox/<tool-id>`，production base 为 `/<tool-id>/`，输出只写
  `apps/<tool-id>/dist/`。
- 只使用根 `pnpm-lock.yaml`；受控工具链依赖使用 `catalog:`，不得生成 app 级 lockfile。
- 禁止 import 其他 `apps/*`；跨工具能力只能消费 `packages/*`。
- 工具私有 storage key 使用 `toolbox.<tool-id>.<key>`；全局主题/语言只用
  `toolbox-theme` 和 `toolbox-lang`。
- URL query 必须校验、可恢复默认值，不能承载密钥、身份或其他敏感输入。
- 新工具失败时不得改变任何 stable 应用产物；未通过审核时必须能从部署清单中完全省略。

## 4. 公共平台接口

新工具从第一天依赖以下包，不复制它们的实现：

```json
{
  "dependencies": {
    "@toolbox/i18n": "workspace:*",
    "@toolbox/nav": "workspace:*",
    "@toolbox/theme": "workspace:*"
  }
}
```

| 包 | 必须使用的能力 | 禁止做法 |
|---|---|---|
| `@toolbox/theme` | pre-paint、light/dark 状态、语义 token、系统字体 | 复制 Catppuccin 色号、远端字体、自建全局主题键 |
| `@toolbox/nav` | 唯一顶部 NavBar、当前 app、统一页脚、canonical app icon | 工具内部再放语言/主题按钮、复制导航 CSS/JS |
| `@toolbox/i18n` | `zh`/`en` 状态、订阅或 React Provider、HTML `lang` 同步 | 只翻译可见正文、拼接依赖语序的半句话 |
| `@toolbox/app-manifest` | id、route、名称、描述、icon、双语关键词、公开状态 | 在首页或 Nav 中手写另一份工具列表 |

精确 API 以各包 README 和类型声明为准。共享包 API 不能为了单个新工具随意破坏；确需
扩展时，先写契约测试和兼容方案，并在交接文档中单列影响范围。

应用通常通过 `@toolbox/nav` 间接消费 manifest；只有直接 import manifest 的应用才把它列为
自身 dependency。无论是否直接依赖，都必须在 `packages/app-manifest/manifest.js` 注册条目。

### Manifest 注册

候选分支必须注册 canonical icon、`navLabel`、`description` 与本地化 `keywords`。关键词
是用户会用来描述目标、输入、输出或同义概念的短词，不堆砌营销词；中文与英文分别维护，
搜索当前语言时只使用相应语言内容。新条目省略 status 或显式使用 `hidden`：

```js
defineApp({
  id: 'example-tool',
  path: '/example-tool/',
  name: 'Example Tool',
  navLabel: { zh: '示例工具', en: 'Example Tool' },
  description: { zh: '一句话说明', en: 'One-line description' },
  keywords: {
    zh: ['同义词', '输入类型', '输出类型'],
    en: ['synonym', 'input term', 'output term'],
  },
  icon: { viewBox: '0 0 48 48', svg: '<path ... />' },
})
```

`hidden` 不进入 stable 导航；`preview` 和 `stable` 的晋级只由集成审核决定。

## 5. 页面与交互标准

- 页面只有一个共享 NavBar；顶部 `Toolbox` 文字链接回首页，旁边菜单按钮负责触屏展开。
- 页面标题使用 manifest 中的 canonical icon；图标不加载第三方图标站或远端资源。
- 使用共享系统字体、语义颜色、圆角、focus ring 和页脚骨架。
- 全局控件 hover 只允许优雅的颜色/图标反馈，不画背景选中框；keyboard
  `:focus-visible` 必须清楚。
- 工具业务导航与全局 NavBar 分层；业务页面不能覆盖 `.toolbox-*` 共享类名。
- 首次提交即验证 light/dark、zh/en、375/390px mobile、1440px desktop、键盘导航与
  `prefers-reduced-motion`。
- 页面 title、meta description、label、placeholder、aria label、错误、空状态和降级提示
  必须同时提供中英文。

## 6. 文档标准与合并清理

### 长期保留

- `README.md` 与 `README.zh-CN.md`：用途、输入输出、公式/假设、隐私与联网行为、离线
  fallback、开发/测试命令、已知限制。
- 复杂且长期有效的算法或数据来源说明可放 `apps/<tool-id>/docs/`；不保存过程日志、聊天
  摘要、逐步计划或已完成 TODO。
- 用户可见变化由集成模型在合并后写入根 `CHANGELOG.md`，候选开发 Agent不预先声明发布。

### 临时交接文件

`NEW_TOOL_HANDOFF.md` 必须包含：

1. Brief 与验收勾选结果。
2. 相对 `dev` 的文件/依赖/平台变更摘要。
3. 外部请求、storage、URL 参数和数据流审计。
4. 实际运行过的命令与结果，不写“应当通过”。
5. 未完成项、已知风险、视觉检查矩阵。
6. 给集成模型的操作：哪些内容迁入 README/CHANGELOG/TASKS、哪些临时 fixture 删除。

集成模型完成审核并把必要信息迁入长期文档后，必须删除
`apps/<tool-id>/NEW_TOOL_HANDOFF.md`。不得把一次性实现计划、截图、调试日志或失败输出
留在合并后的 `dev`。

## 7. 隐私与网络红线

默认纯客户端、默认不发起外部业务请求。禁止追踪、广告、遥测、指纹、远端字体、自有
后端、数据库和账号体系，除非维护者对具体产品例外另行明确授权。

确需实时外部数据时必须同时满足：

1. Brief 记录维护者批准；UI 持续披露服务、用途和发送内容。
2. 固定最小 origin allowlist；只发送业务必需的最小字段，不发送其他页面输入或 storage。
3. 设置超时、失败处理和可用的手动/离线 fallback；测试不依赖真实网络。
4. 在 `config/external-origins.json` 以“源文件 → origins”最小登记。
5. README 的隐私表述与实际请求完全一致。

禁止提交 `.env`、密钥、Token、Authorization、真实主机/IP/端口、SSH/部署信息、个人邮箱、
设备绝对路径、生产日志、storage dump 或包含真实输入的截图。

## 8. 必须继承的测试包

每个 app 的 `package.json` 必须提供 `dev`、`build`、`test`、`lint`、`preview` 与
`test:browser`。最小覆盖：

- 核心纯函数：正常、边界、非法值、单位、舍入和异常。
- 一条主要渲染/交互流程，以及损坏 query/storage 的安全恢复。
- zh/en key 完整性与 `<html lang>` 同步。
- 主题 token、全局/私有 storage key、唯一 NavBar/页脚契约。
- 375/390px 与 1440px production browser smoke；覆盖 light/dark、zh/en、keyboard focus、
  横向溢出、console/page errors 和失败资源。
- Canvas/WebGL：计算数据测试、可见渲染 smoke、resize/cleanup，以及可理解的文本替代。
- 外部请求：注入 fetcher/adapter，覆盖成功、超时、全部来源失败和 fallback，不访问真实网络。

测试失败时修实现或经审核修正错误断言；不得通过删测试、放宽退出码、全量更新 snapshot、
跳过或降低 lint 规则制造绿色结果。

根命令 `pnpm test:browser` 会自动发现所有提供 `test:browser` 的 workspace，不需要手工维护
应用名单。`pnpm check:contracts` 会验证每个新工具提供上述脚本和平台依赖。

## 9. 只预览新工具：推荐做法

开发循环中只启动/编译新工具是推荐做法，它能降低等待时间，也不会运行其他工具：

```bash
pnpm --filter=@toolbox/<tool-id> dev
pnpm --filter=@toolbox/<tool-id> build
pnpm --filter=@toolbox/<tool-id> preview
pnpm --filter=@toolbox/<tool-id> test
pnpm --filter=@toolbox/<tool-id> lint
pnpm --filter=@toolbox/<tool-id> test:browser
```

注意：这是开发优化，不是合并豁免。候选完成、修改共享包或准备交接时仍要运行全仓门禁。
Vite dev server 只按访问路径转换所需模块；production preview 前只构建目标 app 即可。

## 10. 完成与交接门禁

候选分支交接前依次运行：

```bash
pnpm --filter=@toolbox/<tool-id> build
pnpm --filter=@toolbox/<tool-id> test
pnpm --filter=@toolbox/<tool-id> lint
pnpm --filter=@toolbox/<tool-id> test:browser
pnpm check:privacy
pnpm check:contracts
pnpm build
pnpm test
pnpm lint
pnpm test:browser
git diff --check dev...HEAD
```

交接时必须确认：

- [ ] 分支为 `newdev/<tool-id>` 且基点来自 `dev`；`main`/`dev` 未被开发 Agent 修改。
- [ ] manifest 仍为 `hidden`，关键词、icon、双语描述完整。
- [ ] 只修改目标 app、必要 manifest/平台契约和对应测试，没有跨 app import。
- [ ] light/dark × zh/en × mobile/desktop 与键盘检查通过。
- [ ] 隐私、联网、storage、query、fallback 与 README 一致。
- [ ] 单工具与全仓门禁的真实结果已写入 `NEW_TOOL_HANDOFF.md`。
- [ ] 没有 dist、日志、截图、临时 fixture、app lockfile 或真实环境数据待提交。
- [ ] 开发 Agent没有合并、提升 `stable`、改 CHANGELOG 发布版本或部署。

## 11. `dev` 集成模型检查清单

集成模型只在维护者明确要求后执行，重点不是“测试为绿”而是验证候选没有扩大故障半径：

1. 比较 `dev...newdev/<tool-id>`，逐项核对 handoff、依赖、网络与共享包差异。
2. 独立复算核心用例，执行单工具和全仓门禁，检查生产 base/output 与部署隔离。
3. 删除 `NEW_TOOL_HANDOFF.md`、临时 fixture、调试产物和已迁移的一次性说明。
4. 将持久信息留在双语 README/必要算法文档；将真实用户变化写入 CHANGELOG；更新当前
   TASKS，避免复制实现过程。
5. 只有产品/视觉/隐私/质量均通过且维护者同意公开时才将 `hidden` 改为 `preview` 或
   `stable`。合并 `dev` 不等于合并 `main`，更不等于部署。

## 12. 何时扩展共享包

只有同一语义能力已在至少三个工具出现、API 在真实使用中稳定、没有工具业务状态、并已有
light/dark、zh/en、keyboard、mobile 契约测试时，才考虑进入共享 UI 层。否则保留在工具
内部；适度重复比过早耦合安全。
