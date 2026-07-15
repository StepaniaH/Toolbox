---
id: crypto-lab
route: /crypto-lab/
name: CryptoLab
problem: 将现有本地密码学候选完善为可公开发现、状态一致且不会误导用户的工具。
inputs: 文本、编码数据、密钥、JWT、CL1 数据包与本地二维码图片。
outputs: 编码/摘要/密文/签名/JWT 检查结果，以及公钥保护的 CL1 二维码与解密消息。
assumptions: RSA-OAEP 与 RSA-PSS 使用 SHA-256；JWT 时效按本机当前时间和 RFC 7519 NumericDate 检查；解码不等于验签。
privacy: 纯客户端；不联网、不持久化业务输入、不使用账号、Cookie、遥测、广告或远端字体。
offline_fallback: 所有业务能力均离线运行；缺少 Web Crypto 或图像解码能力时显示本地错误，不上传数据。
non_goals: 不提供密钥托管、身份认证、证书链、撤销、前向保密、密码破解、服务端同步或生产级秘密管理。
acceptance:
  - Secure Share 修改上游输入后不会继续展示过期二维码或已解密明文，并可一键清除敏感状态。
  - Secure Share 显示可复制的 SHA-256 公钥指纹，帮助双方通过独立渠道核对收件人密钥。
  - RSA 工作台明确分离 OAEP 加密与 PSS 签名密钥用途，签名验证使用独立签名字段。
  - RSA-OAEP 在调用密码运算前按密钥模数与 SHA-256 预算拒绝过长 UTF-8 明文。
  - JWT 明确显示“已解码但未验证”，并检查 exp/nbf/iat 的 NumericDate 类型与当前时效。
  - 中英文、明暗主题、桌面/移动端与键盘流程通过有效测试，无外部业务请求或私有持久化。
---

# Candidate handoff

## Decisions

- 优先修复安全语义、状态失效与公开前可理解性，不继续堆叠低价值算法。
- 公钥指纹对规范化 SPKI DER 执行 SHA-256，完整显示 32 字节十六进制并按组分隔。
- RSA-OAEP 明文预算使用 RFC 8017 的 `k - 2hLen - 2`；SHA-256 的 `hLen` 为 32 字节。
- JWT 时效检查只解释标准声明，不代替签名、issuer、audience 或业务授权验证。

## Audit boundary

- External requests: none; same-origin static assets only.
- Storage: global `toolbox-theme` / `toolbox-lang` only; no CryptoLab private storage.
- Query parameters: none.
- Data flow: all keys, messages, tokens, QR images and generated object URLs remain in page memory.

## Changed surface

- CryptoLab RSA/JWT/Secure Share logic, UI, translations, focused unit tests, and production browser smoke.
- CryptoLab bilingual READMEs and the current task entry.
- No dependency, lockfile, shared package, manifest visibility, Homepage, deployment, or network-allowlist change in the candidate commit.

## Validation results

- `pnpm --filter=@toolbox/crypto-lab build` — passed; heavy panels and QR dependencies remain lazy chunks.
- `pnpm --filter=@toolbox/crypto-lab test` — passed, 119 tests.
- `pnpm --filter=@toolbox/crypto-lab lint` — passed with zero warnings.
- `pnpm --filter=@toolbox/crypto-lab test:browser` — passed real key generation, fingerprint, QR round trip, state invalidation, workspace retention, clear-all, PSS sign/verify, shared shell, language/theme, desktop/mobile, overflow, and runtime-error checks.
- `pnpm check:privacy` — passed across 343 tracked or unignored files after replacing a PEM-shaped negative fixture.
- `pnpm check:contracts` — passed for all seven apps.
- `pnpm build` — passed for all seven production applications.
- `pnpm test` — passed, 1,148 tests across the workspace.
- `pnpm lint` — passed with zero warnings.
- `pnpm test:browser` — passed all seven production browser suites.

## Visual matrix

- Automated shared matrix passed light/dark × zh/en at 1440 × 1100 and 390 × 844, including focus, single NavBar/footer, no horizontal overflow, and no vertical tab scrollbar.
- Manually inspected temporary, untracked screenshots for dark Chinese Secure Share, light English RSA-PSS, and light Chinese mobile JWT.
- Replaced the asymmetric public/private two-column key area with a single ordered section after visual review found excessive empty space.

## Known limits

- A fingerprint only helps after comparison through an independently trusted channel; it does not authenticate a person by itself.
- JWT time checks use the current device clock and do not replace issuer, audience, replay, or business authorization validation.
- The tool remains an educational/developer utility, not a key-management system; no key custody, recovery, revocation, forward secrecy, or compromised-device protection is provided.

## Integration cleanup

- Move durable behavior and limits into both CryptoLab READMEs and the root changelog.
- Update current release/task/index facts and Homepage presentation when promoting the manifest entry.
- Delete this file after the candidate is reviewed and merged into `dev`.
