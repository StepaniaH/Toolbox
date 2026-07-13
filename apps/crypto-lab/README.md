# CryptoLab

A local, browser-only toolkit for encoding, hashing, symmetric/asymmetric encryption, and JWT parsing. All computation happens inside your browser; no data is sent to any server.

## Features

- **Encoding & Radix**: Base64 / Base64URL, URL / URL Component, HTML entities, Hex with customizable delimiters/prefixes, Base32, Base58, and arbitrary base conversion.
- **Digests & HMAC**: MD5, SHA-1, SHA-256, SHA-512, SHA3-256, SHA3-512, and HMAC-SHA256/SHA512 with live hex/base64 output.
- **Symmetric Encryption**: AES-256-GCM, AES-256-CBC, and ChaCha20, all via the Web Crypto API or a pure TypeScript ChaCha20 implementation.
- **RSA Workbench**: Generate 1024/2048/4096-bit RSA key pairs, export/import PEM, encrypt/decrypt with RSA-OAEP, sign/verify with RSA-PSS.
- **JWT**: Decode header/payload and verify HS256/HS512 signatures locally.

## Privacy

- Pure client-side: no backend, no telemetry, no cookies, no remote fonts.
- Keys, plaintext, ciphertext, secrets, and JWTs never leave the page.
- The only network request the app itself makes is loading its own static assets from the same origin.

## Development

```bash
pnpm --filter=@toolbox/crypto-lab dev
pnpm --filter=@toolbox/crypto-lab build
pnpm --filter=@toolbox/crypto-lab test
pnpm --filter=@toolbox/crypto-lab lint
pnpm --filter=@toolbox/crypto-lab test:browser
```

## Browser Support

Requires a modern browser with the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). RSA key generation and AES operations use `crypto.subtle`. Pure-JavaScript fallbacks cover MD5, SHA-1, SHA-3, Base32, Base58, and ChaCha20.

## Known Limitations

- MD5 and SHA-1 are provided for compatibility and debugging only; do not use them for new security-sensitive work.
- ChaCha20 is implemented in TypeScript rather than via Web Crypto, so it is suitable for short messages and education but not high-throughput streaming.
- Arbitrary base conversion is for integer strings only.
- RSA signing uses RSA-PSS with SHA-256; encryption uses RSA-OAEP with SHA-256. The same key pair cannot be used for both operations because the underlying algorithms differ.

## License

MIT
