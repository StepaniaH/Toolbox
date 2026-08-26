# Toolbox — 依赖与回滚策略

> 适用于直接影响构建、运行时或测试基线的依赖变更。当前阶段只集中管理已经安装并验证过的版本，不借迁移 catalog 升级依赖。

## 一、三个事实层

| 层 | 唯一来源 | 职责 |
|----|----------|------|
| 包管理器 | 根 `package.json` 的 `packageManager` | 固定仓库使用的 pnpm 版本 |
| 直接依赖策略 | 根 `pnpm-workspace.yaml` 的 `catalog` / `catalogs` | 固定 React、Vite、Vitest、TypeScript 与 Vite React plugin 的允许组合 |
| 完整解析结果 | 根 `pnpm-lock.yaml` | 固定直接与间接依赖的实际版本和 peer 组合 |

应用和共享包仍在自己的 `package.json` 声明“使用哪个依赖”，但受控工具链只能写 `catalog:` 或命名 catalog，不能重复写版本范围。`peerDependencies` 描述对外兼容范围，不代表本仓库安装版本，因此可以保留如 `react >=18` 的语义范围。

pnpm 官方将 catalog 定义为 workspace 内可复用的版本常量，并会在 `pnpm pack` / `pnpm publish` 时替换为普通版本范围，详见 [pnpm Catalogs](https://pnpm.io/catalogs)。

传递依赖的安全下限使用 `pnpm-workspace.yaml` 的 `overrides`（当前仅 `postcss ^8.5.18`，覆盖
GHSA-r28c-9q8g-f849 及 nanoid 生成器循环两则通告）。overrides 是全仓解析约束：只允许为安全
修复或强制 catalog 而设，必须随附通告编号与审计结果。workspace 级 overrides 需要 pnpm ≥10 的
语义；本机执行 install 应使用根 `package.json` 的 `packageManager` 所钉版本（如
`npx pnpm@11.10.0 install --no-frozen-lockfile`），旧版 pnpm 会静默忽略该配置。

## 二、当前依赖线

| 依赖线 | 应用 | Vite | React plugin | TypeScript | React / React DOM | Vitest |
|--------|------|------|--------------|------------|-------------------|--------|
| 默认稳定线 | Homepage、Monitor Choice、SaneUnits、FormTran；共享包开发依赖 | 6.4.3 | 5.0.4（React 应用） | 5.9.3 | 19.2.7 | 3.2.7 |
| `vite7` 迁移线 | RateLens、CryptoLab | 7.3.6 | 4.7.0 | 默认稳定线 | 默认稳定线 | 默认稳定线 |
| `vite8` 迁移线 | ChronoSphere | 8.1.3 | 6.0.3 | 6.0.3 | 默认稳定线 | 默认稳定线 |

这些并存组合是现有应用已经通过全仓门禁的迁移边界，不是推荐新工具自由选择的菜单。新工具默认使用稳定线；新增依赖线必须是独立架构任务，并说明为何不能复用现有线。

### 已审核的应用运行时能力

| 应用 | 依赖 | 用途与边界 |
|---|---|---|
| FormTran | `@discourse/heic` 1.0.0（Apache-2.0）；`pdf-lib` 1.17.1（MIT） | HEIC/HEIF 后备解码约 960 KB WASM；PDF 解析改写约 408 KB raw / 131 KB gzip；两者均仅按需同源加载，不访问远端服务，并分别受 64 MB 与 PDF 文件/总量/页数预算约束 |
| CryptoLab | `qrcode` 1.5.4（MIT）、`jsqr` 1.4.0（Apache-2.0） | 本地生成/读取 Secure Share 二维码；不包含私钥、遥测或网络后备路径 |
| FormTran（2026-08-26 评估新增） | `yaml` 2.9.0（ISC） | 表格工作台读写 YAML：解析限定 core schema、字符串化输出；与 pdf-lib 相同仅按需同源动态加载，不进入入口 chunk，无网络路径。JSON/XML 使用原生能力，未新增依赖 |
| FormTran（2026-08-26 评估新增） | `gifuct-js` 2.1.2（MIT）；传递依赖 `js-binary-schema-parser` 2.0.3 | GIF 帧级解码（disposal 合成、局部帧拼合）：仅在 GIF 源文件工具使用时按需同源加载；受 64 MB 输入 / 120 帧 / 单边 4096 px / 总量 1 亿像素预算约束，无网络路径 |

## 三、升级规则

1. 依赖升级不得与功能、视觉或业务重构混在同一提交。
2. 一次只升级一条依赖线；先在该线的代表应用验证，再跑全仓门禁。
3. React 与 React DOM 必须来自同一 catalog；Vite 与 React plugin 也必须来自同一 catalog。
4. 修改版本只改 `pnpm-workspace.yaml`，随后用 `pnpm install` 更新根锁文件；不得手改 `pnpm-lock.yaml`。
5. 审查锁文件是否仅包含目标依赖及其必要传递依赖；出现无关升级时停止并拆分。
6. 构建器、CSS 处理器或运行时依赖升级即使单元测试通过，也要对受影响应用补浏览器 smoke；有视觉影响时执行 light/dark、zh/zh-Hant/en、desktop/mobile 矩阵。
7. 平台包契约升级先保持向后兼容并迁移一个消费者；破坏性变更留到独立的平台版本阶段。

最小执行顺序：

```bash
pnpm install
pnpm --filter=@toolbox/<target> build
pnpm --filter=@toolbox/<target> test
pnpm --filter=@toolbox/<target> lint
pnpm check:privacy
pnpm check:contracts
pnpm build
pnpm test
pnpm lint
```

## 四、回滚方式

### 尚未进入稳定发布

- 将升级保持为单独提交。
- 使用 `git revert <upgrade-commit>` 生成可审计的反向提交，不重写共享历史。
- 执行 `pnpm install --frozen-lockfile`，确认旧锁文件可完整恢复，再跑受影响应用和全仓门禁。

### 已进入稳定发布

1. 先恢复上一份已验证的 `main` SHA 或 release 产物，避免在故障现场重新解析依赖。
2. 在开发线上 revert 原升级提交并通过完整门禁。
3. 按正常晋级流程把回滚提交带回 `main`；不 force push、不移动既有 tag。
4. 如果依赖升级伴随 storage/schema 迁移，新代码必须先保证旧数据可读；回滚前确认没有产生旧版本无法解析的持久化数据。

### 共享平台包

- 兼容性问题优先回滚单个消费者迁移；平台包仍被其他应用使用时，不直接删除旧 API。
- 平台实现本身有全局缺陷时，回滚平台提交和所有依赖它的消费者提交，并重新构建每个应用产物。
- 发布记录必须写明可回滚 commit 和受影响应用，真实部署目标与环境值不进入仓库。

## 五、平台包版本策略

平台包（`packages/*`）按语义化版本发布到 workspace，版本号只表达“公共契约”的变化：

| 变更 | 版本动作 | 必须随附 |
|---|---|---|
| 新增 token、属性、方法或可选字段；默认行为逐字节不变 | minor | 契约测试覆盖新面；包 README 增补用法 |
| 改名、删除、值域收窄、默认值变化、存储键语义变化 | major | 迁移说明（旧→新）、受影响应用清单、逐应用迁移提交 |
| 纯内部实现调整，公共面零变化 | patch | 既有测试全绿 |

契约常量（如 `THEME_CONTRACT_VERSION`）每扩展一次公共契约面就递增，与 semver 档位独立。
包的 `package.json` 用 `contractVersion` 字段声明当前常量值，`check:contracts` 校验代码
常量与该声明一致，防止两处漂移；semver 档位与迁移说明由发布审核按本表核对。

## 六、机器门禁

`pnpm check:contracts` 会拒绝：

- 受控工具链在 app/package 中直接写版本号；
- 引用不存在或未包含该依赖的 catalog；
- React 与 React DOM 使用不同 catalog；
- Vite 与 React plugin 使用不同 catalog；
- Vitest 根 override 绕过默认 catalog；
- app 级 npm/yarn 锁文件或缺失的根锁文件；
- 平台包代码内的契约常量与 `package.json` 的 `contractVersion` 声明不一致。

门禁保证声明结构不漂移；许可证、高危漏洞、升级兼容性和视觉差异仍需各自的专项检查。
