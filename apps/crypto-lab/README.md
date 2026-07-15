# CryptoLab

A local, browser-only toolkit for encoding, hashing, encryption, JWT inspection, and public-key protected QR messages. All computation happens inside your browser; no data is sent to any server.

## Features

- **Secure Share**: Generate a recipient RSA key pair, compare its SHA-256 public-key fingerprint over a trusted channel, encrypt a short message into a versioned `CL1` packet and QR code, then import and decrypt it with the matching private key. Dependent results are invalidated when their inputs change, and one action clears the whole sensitive workspace.
- **Encoding & Radix**: Base64 / Base64URL, URL / URL Component, HTML entities, Hex with customizable delimiters/prefixes, Base32, Base58, and arbitrary base conversion.
- **Digests & HMAC**: MD5, SHA-1, SHA-256, SHA-512, SHA3-256, SHA3-512, and HMAC-SHA256/SHA512 with live hex/base64 output.
- **Symmetric Encryption**: AES-256-GCM, AES-256-CBC, and ChaCha20, all via the Web Crypto API or a pure TypeScript ChaCha20 implementation.
- **RSA Workbench**: Keep RSA-OAEP encryption and RSA-PSS signing in separate key-purpose modes, generate 2048/4096-bit key pairs, import/export bounded PEM, and sign/verify with a dedicated signature field.
- **JWT**: Decode header/payload, clearly distinguish decoding from verification, verify HS256/HS512 signatures locally, and inspect `exp` / `nbf` / `iat` NumericDate claims against the current device time.
- **Knowledge & About**: Explain algorithm boundaries, privacy, the security model, and the limits of compatibility-only primitives.

## Secure Share design

Secure Share uses hybrid encryption instead of applying RSA directly to the message:

1. The recipient generates a 2048-bit RSA-OAEP/SHA-256 key pair, shares only the public key, and confirms the full SHA-256 SPKI fingerprint with the sender over a separate trusted channel.
2. The sender creates a fresh random AES-256-GCM key and 96-bit IV for each message.
3. AES-GCM encrypts and authenticates the UTF-8 message with `CryptoLab.Share.v1` as additional authenticated data.
4. RSA-OAEP wraps only the AES key. The QR code contains a compact `CL1` packet with the wrapped key, IV, and ciphertext.
5. The recipient imports a PNG/JPEG/WebP QR image or `.cryptolab`/text packet and decrypts it with the matching private key.

Packets are strictly versioned and length-checked before expensive cryptography. QR messages are limited to 1,024 UTF-8 bytes; imported files are limited to 8 MB and decoded images to 16 megapixels. The private key is never added to a QR code, URL, storage, or network request.

## Privacy

- Pure client-side: no backend, no telemetry, no cookies, no remote fonts.
- Keys, plaintext, ciphertext, secrets, and JWTs never leave the page.
- User content is kept only in current page memory. A module remains mounted after it is first opened so users can read guidance and return without losing work; the Secure Share clear action or a refresh removes its sensitive state. CryptoLab does not persist private app state.
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
- AES-CBC and raw ChaCha20 do not authenticate ciphertext. They are compatibility/learning tools, not recommended protocol building blocks. Use AES-GCM for new local data.
- ChaCha20 is implemented in TypeScript rather than via Web Crypto, so it is suitable for short messages and education but not high-throughput streaming.
- Arbitrary base conversion is for integer strings only.
- RSA signing uses RSA-PSS with SHA-256; encryption uses RSA-OAEP with SHA-256. CryptoLab clears key material when switching purposes so separate key pairs are used. With SHA-256, RSA-OAEP accepts at most 190 UTF-8 bytes for a 2048-bit key or 446 bytes for a 4096-bit key.
- JWT input is limited to 64 KiB and RSA PEM input to 16 KiB before parsing. Time-claim inspection does not replace signature, issuer, audience, replay, or application authorization checks.
- Secure Share does not establish the recipient's identity or provide key custody, revocation, forward secrecy, or protection from a compromised browser/device. A matching fingerprint helps detect a wrong public key but is only trustworthy when compared over an independently trusted channel. Use audited key-management systems for high-value or long-lived keys.

## Performance

Encoding stays in the initial application bundle. Hashing, symmetric encryption, RSA, JWT, the knowledge base, About, and Secure Share are loaded on demand; QR generation/decoding dependencies are fetched only when Secure Share is opened.

## License

MIT
