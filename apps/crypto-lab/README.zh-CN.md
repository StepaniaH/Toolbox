# CryptoLab

一个纯浏览器端的编码、哈希、对称/非对称加密与 JWT 解析工具箱。所有计算都在浏览器内完成，数据不会发送到任何服务器。

## 功能

- **编码与进制**：Base64 / Base64URL、URL / URL Component、HTML 实体、可自定义分隔符与前缀的 Hex、Base32、Base58，以及任意进制整数转换。
- **摘要与 HMAC**：MD5、SHA-1、SHA-256、SHA-512、SHA3-256、SHA3-512，以及 HMAC-SHA256/SHA512，实时输出小写/大写 HEX 和 Base64。
- **对称加密**：AES-256-GCM、AES-256-CBC 与 ChaCha20，分别使用 Web Crypto API 或纯 TypeScript 实现。
- **RSA 工作台**：生成 1024/2048/4096 位 RSA 密钥对、PEM 导入导出、RSA-OAEP 加解密、RSA-PSS 签名与验证。
- **JWT**：解码 Header/Payload，并在本地校验 HS256/HS512 签名。

## 隐私

- 纯前端：无后端、无遥测、无 Cookie、无远端字体。
- 密钥、明文、密文、Secret 与 JWT Token 不会离开页面。
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
- ChaCha20 使用 TypeScript 实现，适合短消息与教育用途，不适合高吞吐流式场景。
- 任意进制转换仅支持整数字符串。
- RSA 签名使用 RSA-PSS/SHA-256，加密使用 RSA-OAEP/SHA-256；由于算法不同，同一密钥对不能同时用于签名与加密。

## 许可证

MIT
