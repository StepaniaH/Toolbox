# Toolbox 新工具开发手册

> 目标：让一次 vibe coding 可以自由探索业务，同时默认继承 Toolbox 的稳定性、隐私和设计底座。
>
> 当前这是人和 agent 都可执行的开发 playbook；待流程稳定后，可从本文生成仓库内 skill / scaffold 命令。

## 一、先写 1 页工具 Brief

开始编码前固定以下信息：

```yaml
id: kebab-case-id
route: /kebab-case-id/
name: ProductName
problem: 用户要解决的一个明确问题
inputs: 用户输入
outputs: 工具给出的结果
assumptions: 会影响结论的假设
privacy: 数据是否保存、是否需要外部网络
offline_fallback: 无网络时如何工作
non_goals: 这次明确不做什么
acceptance: 3-8 条可验证验收标准
```

如果 Brief 不能说明“输入如何变成结果”，先澄清产品问题，不要通过堆页面掩盖不确定性。

## 二、选择实现方式

### 默认建议

使用 Vite 作为构建壳，内部实现按工具需要选择：

- 简单表单 / 小计算器：Vanilla TypeScript + Vite。
- 状态与交互较多：React + TypeScript + Vite。
- Canvas / WebGL：仍使用 Vite，绘制引擎按需选择。

新增工具不建议采用“无 package.json、直接复制源码部署”的模式。现有静态应用已经证明这种方式难以消费 workspace 依赖，也容易让 nav/theme 副本漂移。

### 依赖原则

- 优先使用浏览器平台能力和已有依赖。
- 新依赖必须说明用途、体积、许可证、维护状态和是否发起网络请求。
- 不因为模板方便就引入后端、数据库、账号或追踪 SDK。
- 不从其他 `apps/*` 复制业务代码；真正稳定的跨工具能力先经过评审再进入 `packages/*`。

## 三、目录与命名契约

```text
apps/<app-id>/
├── src/
├── public/               # 可选，本地静态资产
├── index.html
├── package.json
├── vite.config.*
├── README.md
├── README.zh-CN.md
└── AGENTS.md             # 仅在有局部规则时创建
```

必须满足：

- package name：`@toolbox/<app-id>`。
- production base：`/<app-id>/`。
- build output：仅 `apps/<app-id>/dist/`。
- 不写仓库外路径，不读取其他工具的源码或构建产物。
- 私有持久化键：`toolbox.<app-id>.<key>`。
- 全局主题和语言只能使用 `toolbox-theme` / `toolbox-lang`。
- URL query 参数必须可验证、可恢复默认值，并避免放入敏感输入。

## 四、接入平台能力

新工具从第一天就接入：

```json
{
  "dependencies": {
    "@toolbox/i18n": "workspace:*",
    "@toolbox/nav": "workspace:*",
    "@toolbox/theme": "workspace:*"
  }
}
```

具体 API 以各包 README 为准，发布验收以 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) 为准。

### Theme

- 导入 `@toolbox/theme/styles.css`，不复制 Catppuccin 色号。
- 首屏前应用 `toolbox-theme`，避免 theme flash。
- 工具样式只消费语义 token；新 token 先确认是否真有跨工具语义。

### Nav

- 页面只挂载一个共享 NavBar，并传入正确 `currentApp`。
- 工具内部不再创建主题/语言按钮。
- 业务导航与全局 NavBar 分层，不能覆盖共享类名。

### i18n

- 中文和英文同时提交；中文可作为内容源，但不能“以后再补英文”。
- 页面标题、description、aria label、错误和空状态都要翻译。
- 使用完整模板和参数，不拼接依赖语序的半句话。

### App catalog

当前工具信息仍分散在 Homepage 和两种 NavBar 中。app manifest 建成前，新增工具需逐项核对这些位置；建成后只允许修改 manifest。具体过渡任务见 [TASKS.md](./TASKS.md)。

新工具在开发阶段应标记为 `hidden`，不能因为目录存在就自动进入稳定导航。

## 五、隔离设计

业务代码必须能回答以下问题：

- 工具抛出异常时，是否只影响自己的页面？
- 工具未完成时，是否可以完全不出现在导航和部署产物？
- 工具依赖升级时，是否无需修改其他 `apps/*`？
- 工具 route 被移除时，是否不会改变其他路径？
- 工具 localStorage 被清除或损坏时，是否安全回退默认值？
- 工具外部数据不可用时，核心流程是否仍有本地 fallback？

React 工具建议提供顶层 Error Boundary；所有工具都要对非法 URL 参数、损坏的 storage 和空数据做恢复。

## 六、隐私与网络

默认规则：不发起外部业务请求。

确实需要实时数据时，必须同时满足：

1. UI 在请求前说明数据用途和第三方服务。
2. 请求由用户主动操作触发，不能页面加载即自动发送。
3. 不发送工具输入、持久化数据或可识别用户的信息，除非用户明确知道且任务本身必需。
4. 提供手动值、内置参考值或离线模式。
5. 端点进入仓库 allowlist，并有超时、失败与降级测试。
6. README 与隐私说明准确描述真实行为。

禁止提交：`.env`、公网/内网 IP、真实端口、主机名、SSH 配置、Token、个人邮箱、设备绝对路径、生产日志和浏览器存储转储。

## 七、最小测试包

新工具至少包含：

- 业务纯函数的边界、单位、舍入和异常测试。
- 一条主流程渲染/交互测试。
- zh/en key 完整性测试。
- 主题 token 与全局 storage key 契约测试。
- 非法 query/storage 的恢复测试。
- 375px 与桌面宽度的浏览器 smoke。
- 如果使用 Canvas：计算数据测试 + 至少一个可见渲染 smoke，并提供文本替代。

外部请求必须注入 fetcher 或 adapter，使测试无需真实网络。

## 八、开发顺序

1. 在 `dev` 确认工作区干净并更新 [TASKS.md](./TASKS.md)。
2. 写 Brief、隐私判断和验收标准。
3. 创建独立目录与最小可构建页面。
4. 先接 theme/nav/i18n，再开发业务界面。
5. 把计算逻辑与 UI 分离，先写边界测试。
6. 完成主流程后跑单工具 build/test/lint。
7. 按 DESIGN_SYSTEM 做 light/dark、zh/en、mobile/desktop 检查。
8. 注册为 `hidden` 或 `preview`，运行全仓门禁。
9. 独立提交；未获维护者确认不得合并 `main` 或部署。

## 九、验证命令

```bash
pnpm --filter=@toolbox/<app-id> build
pnpm --filter=@toolbox/<app-id> test
pnpm --filter=@toolbox/<app-id> lint

pnpm build
pnpm test
pnpm lint
```

未来的契约命令（待实现）：

```bash
pnpm check:contracts
pnpm test:smoke
```

## 十、发布门禁

- [ ] 分支来自 `dev`，没有直接修改 `main`。
- [ ] 只修改目标工具、必要平台包、manifest 与相关文档。
- [ ] 新工具失败不会改变稳定工具的构建产物。
- [ ] theme/nav/i18n 接入完整，没有复制共享实现。
- [ ] light/dark × zh/en × mobile/desktop 检查通过。
- [ ] 计算、错误恢复和主流程测试通过。
- [ ] 无自动第三方访问；如有可选请求，用户主动触发且已披露。
- [ ] staged diff 与提交身份通过隐私检查；邮箱属于维护者确认公开的身份。
- [ ] 全仓 build/test/lint/smoke 通过。
- [ ] CHANGELOG、README 与 TASKS 状态同步。

## 十一、何时提炼成共享组件

只有同时满足以下条件，组件才适合进入未来的 `packages/ui`：

- 至少三个工具存在同一语义需求。
- API 已在实际使用中稳定，不是为了预测未来而抽象。
- 组件不携带某个工具的业务状态或领域文案。
- light/dark、zh/en、keyboard、mobile 已有契约测试。
- 升级和回滚路径清楚。

否则保留在工具内部。适度重复比过早共享造成的跨工具耦合更安全。
