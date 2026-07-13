# CryptoLab 新工具交接文档

```yaml
id: crypto-lab
route: /crypto-lab/
name: CryptoLab
problem: 开发者需要在本地快速完成编码/解码、哈希/HMAC、AES/ChaCha20、RSA 与 JWT 的转换与验证，且敏感数据不能离开浏览器。
inputs: 文本、十六进制密钥/IV、PEM 密钥、JWT Token、Secret、进制与编码参数。
outputs: 编码/解码结果、哈希摘要、HMAC、密文、签名、JWT 解码与签名验证状态。
assumptions:
  - 所有计算在浏览器内存中完成，不依赖后端。
  - Web Crypto API 支持 AES-GCM/CBC、RSA-OAEP/RSA-PSS、HMAC-SHA256/512。
  - MD5/SHA-1/SHA-3/ChaCha20/Base32/Base58 使用纯 TypeScript 实现。
  - RSA 签名与加密使用不同算法，因此需要不同的密钥对。
privacy:
  - 不保存用户输入到持久化存储；不发送任何业务数据到外部服务。
  - 仅使用 localStorage 中的全局主题/语言键（toolbox-theme / toolbox-lang）。
offline_fallback: 完全离线可用；所有功能均为本地计算，无需网络。
non_goals:
  - 不提供文件上传、批量流水线、密钥托管、证书链验证或 TLS/SSL 抓包。
  - 不将工具状态提升为 stable 或进入生产导航。
acceptance:
  - [x] Base64/URL/HTML/Hex/Base32/Base58/任意进制双向转换与错误提示。
  - [x] MD5/SHA-1/SHA-256/SHA-512/SHA3-256/SHA3-512 同时输出 lower/upper/base64。
  - [x] HMAC-SHA256/SHA512 实时计算。
  - [x] AES-256-GCM/CBC 加解密与 ChaCha20 流加密。
  - [x] RSA 1024/2048/4096 密钥生成、PEM 导入导出、加解密、签名/验证。
  - [x] JWT 解码与 HS256/HS512 本地签名验证。
  - [x] 一键复制、清空、交换输入输出；错误状态以红色边框/文本提示。
  - [x] 中英双语、明暗主题、移动端 390px/桌面 1440px 无溢出。
  - [x] 单工具与全仓 build/test/lint/test:browser 通过。
```

## 变更摘要

- 新增 `apps/crypto-lab/`：Vite + React + TypeScript + Tailwind v4 应用。
- 在 `packages/app-manifest/manifest.js` 注册 `crypto-lab`（status 默认 `hidden`），附带中英关键词与图标。
- `pnpm-lock.yaml` 增加 `@toolbox/crypto-lab` 依赖段。
- 未修改其他工具代码；未触碰 `main`/`dev`。

## 外部请求 / 存储 / URL 审计

- 外部请求：无。浏览器 smoke 中除同源静态资源外无其他请求。
- Storage：仅读取 `toolbox-theme` / `toolbox-lang`（共享导航/主题），不写私有 storage。
- URL query：未使用。
- Fallback：不适用，因为完全离线。

## 运行过的命令与结果

```bash
pnpm --filter=@toolbox/crypto-lab build      # ✓
pnpm --filter=@toolbox/crypto-lab test       # 102 passed
pnpm --filter=@toolbox/crypto-lab lint       # 0 warnings/errors
pnpm --filter=@toolbox/crypto-lab test:browser  # ✓
pnpm check:privacy                           # ✓
pnpm check:contracts                         # ✓
pnpm build                                   # ✓ (7 apps)
pnpm test                                    # ✓ (16 tasks)
pnpm lint                                    # ✓ (10 tasks)
pnpm test:browser                            # ✓ (6 apps)
git diff --check                             # ✓
```

## 视觉检查矩阵

| 组合 | 桌面 1440px | 移动 390px |
|---|---|---|
| 暗色 + 中文 | 通过 | 通过 |
| 暗色 + 英文 | 通过 | 通过 |
| 亮色 + 中文 | 通过 | 通过 |
| 亮色 + 英文 | 通过 | 通过 |

- 全局导航唯一，主题/语言切换正常。
- 工具标题使用 canonical 40px app mark。
- 输入/输出区在窄屏下未出现横向滚动。

## 未完成项 / 已知风险

- RSA 签名与加密不能复用同一密钥对，UI 中已用“加密密钥对”/“签名密钥对”的生成按钮区分，但可能需要更明显的说明。
- ChaCha20 为纯 TS 实现，未进行性能优化；超大输入可能导致主线程阻塞。
- 未持久化用户输入；刷新页面后状态丢失（符合隐私优先的默认策略）。

## 给集成模型的操作

- 删除本 `NEW_TOOL_HANDOFF.md`。
- 将持久信息保留在 `README.md` / `README.zh-CN.md`。
- 如需公开，由维护者决定将 manifest 中 `crypto-lab` 的 `status` 从 `hidden` 改为 `preview`/`stable`。
- 不更新 CHANGELOG（开发 Agent 不预先声明发布）。
