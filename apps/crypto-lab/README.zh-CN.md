# CryptoLab

一个纯浏览器端的编码、哈希、加密、JWT 检查与公钥二维码安全分享工具箱。所有计算都在浏览器内完成，数据不会发送到任何服务器。

## 功能

- **安全分享**：生成收件人 RSA 密钥对，通过可信的独立渠道核对 SHA-256 公钥指纹，把短消息加密成带版本的 `CL1` 数据包与二维码，再用匹配私钥导入解密。上游输入变化会使关联结果失效，并可一键清除整个敏感工作区。
- **编码与进制**：Base64 / Base64URL、URL / URL Component、HTML 实体、可自定义分隔符与前缀的 Hex、Base32、Base58，以及任意进制整数转换。
- **摘要与 HMAC**：MD5、SHA-1、SHA-256、SHA-512、SHA3-256、SHA3-512，以及 HMAC-SHA256/SHA512，实时输出小写/大写 HEX 和 Base64。
- **对称加密**：AES-256-GCM、AES-256-CBC 与 ChaCha20，分别使用 Web Crypto API 或纯 TypeScript 实现。
- **RSA 工作台**：把 RSA-OAEP 加密与 RSA-PSS 签名分成独立密钥用途，生成 2048/4096 位密钥对，限制 PEM 输入，并使用独立签名字段完成签名/验证。
- **JWT**：解码 Header/Payload，明确区分“已解码”与“已验签”，在本地校验 HS256/HS512，并按设备当前时间解释 `exp` / `nbf` / `iat` NumericDate 声明。
- **知识库与关于**：说明算法边界、隐私、安全模型，以及兼容算法的限制。

## 安全分享设计

安全分享采用混合加密，而不是直接用 RSA 加密整段消息：

1. 收件人生成 2048 位 RSA-OAEP/SHA-256 密钥对，只把公钥交给发送方，并通过另一个可信渠道核对完整的 SHA-256 SPKI 指纹。
2. 发送方每次为消息生成新的随机 AES-256-GCM 密钥与 96-bit IV。
3. AES-GCM 加密并认证 UTF-8 消息，并把 `CryptoLab.Share.v1` 绑定为附加认证数据。
4. RSA-OAEP 只封装 AES 密钥；二维码包含紧凑的 `CL1` 数据包：封装密钥、IV 与密文。
5. 收件人上传 PNG/JPEG/WebP 二维码或 `.cryptolab`/文本数据包，用匹配私钥解密。

程序会在进行昂贵的密码运算前严格检查版本、格式与长度。二维码消息限制为 1,024 个 UTF-8 字节；导入文件限制为 8 MB，图片解码限制为 1,600 万像素。私钥不会写入二维码、URL、本地存储或网络请求。

## 隐私

- 纯前端：无后端、无遥测、无 Cookie、无远端字体。
- 密钥、明文、密文、Secret 与 JWT Token 不会离开页面。
- 用户内容只保留在当前页面内存。模块第一次打开后会保持挂载，方便查看说明再返回继续；「安全分享」可主动清除敏感状态，刷新也会全部清除。CryptoLab 不持久化私有业务状态。
- 应用本身只从同源加载静态资源，不发起任何业务请求。

## 开发

```bash
pnpm --filter=@toolbox/crypto-lab dev
pnpm --filter=@toolbox/crypto-lab build
pnpm --filter=@toolbox/crypto-lab test
pnpm --filter=@toolbox/crypto-lab lint
pnpm --filter=@toolbox/crypto-lab test:browser
```

## 浏览器支持

需要支持 [Web Crypto API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API) 的现代浏览器。RSA 密钥生成与 AES 操作使用 `crypto.subtle`；MD5、SHA-1、SHA-3、Base32、Base58 与 ChaCha20 使用纯 JavaScript 实现。

## 已知限制

- MD5 与 SHA-1 仅用于兼容性与调试，不建议用于新的安全敏感场景。
- AES-CBC 与裸 ChaCha20 不认证密文，只作为兼容/学习工具，不建议用于设计新协议；新本地数据优先使用 AES-GCM。
- ChaCha20 使用 TypeScript 实现，适合短消息与教育用途，不适合高吞吐流式场景。
- 任意进制转换仅支持整数字符串。
- RSA 签名使用 RSA-PSS/SHA-256，加密使用 RSA-OAEP/SHA-256；切换用途时会清除密钥，确保使用不同密钥对。SHA-256 下，2048 位 RSA-OAEP 最多加密 190 个 UTF-8 字节，4096 位最多 446 字节。
- JWT 输入在解析前限制为 64 KiB，RSA PEM 限制为 16 KiB。时效声明检查不能替代签名、issuer、audience、防重放或业务授权验证。
- 安全分享不验证收件人身份，也不提供密钥托管、撤销、前向保密或受感染浏览器/设备防护。匹配指纹可以发现错误公钥，但只有通过独立可信渠道核对才有意义；高价值或长期密钥应使用经过审计的密钥管理方案。

## 性能

编码模块保留在首屏包；摘要、对称加密、RSA、JWT、知识库、关于和安全分享均按需加载。二维码生成/识别依赖只在打开「安全分享」时加载。

## 许可证

MIT
