import { describe, expect, it } from 'vitest'
import { bytesToUtf8, utf8ToBytes } from './utils.ts'
import {
  base64UrlDecode,
  base64UrlEncode,
  decodeJwt,
  verifyJwtHs256,
  verifyJwtHs512,
} from './jwt.ts'

function asBufferSource(bytes: Uint8Array): ArrayBufferView<ArrayBuffer> {
  return bytes as ArrayBufferView<ArrayBuffer>
}

async function makeToken(
  alg: 'HS256' | 'HS512',
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const headerB64 = base64UrlEncode(
    utf8ToBytes(JSON.stringify({ alg, typ: 'JWT' })),
  )
  const payloadB64 = base64UrlEncode(utf8ToBytes(JSON.stringify(payload)))
  const data = utf8ToBytes(`${headerB64}.${payloadB64}`)
  const hash = alg === 'HS256' ? 'SHA-256' : 'SHA-512'
  const key = await crypto.subtle.importKey(
    'raw',
    asBufferSource(utf8ToBytes(secret)),
    { name: 'HMAC', hash },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, asBufferSource(data)),
  )
  const signatureB64 = base64UrlEncode(sig)
  return `${headerB64}.${payloadB64}.${signatureB64}`
}

describe('decodeJwt', () => {
  const knownToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  it('decodes a known JWT', () => {
    const decoded = decodeJwt(knownToken)

    expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(decoded.payload).toEqual({
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
    })
    expect(decoded.signature).toBe(
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    )
    expect(decoded.raw).toEqual({
      header: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      payload:
        'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
      signature: 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    })
  })

  it('round-trips header and payload through base64UrlDecode', () => {
    const decoded = decodeJwt(knownToken)
    expect(JSON.parse(bytesToUtf8(base64UrlDecode(decoded.raw.header)))).toEqual(
      decoded.header,
    )
    expect(
      JSON.parse(bytesToUtf8(base64UrlDecode(decoded.raw.payload))),
    ).toEqual(decoded.payload)
  })

  it('throws for a missing segment', () => {
    expect(() => decodeJwt('header.payload')).toThrow(
      /Invalid JWT structure/,
    )
  })

  it('throws for invalid Base64Url JSON', () => {
    expect(() => decodeJwt('a.b.c')).toThrow(/not valid Base64Url JSON/)
  })
})

describe('verifyJwtHs256', () => {
  const knownToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  const knownSecret = 'your-256-bit-secret'

  it('verifies a known HS256 token with the matching secret', async () => {
    await expect(verifyJwtHs256(knownToken, knownSecret)).resolves.toBe(true)
  })

  it('rejects a token with the wrong secret', async () => {
    await expect(verifyJwtHs256(knownToken, 'wrong-secret')).resolves.toBe(false)
  })

  it('rejects a tampered payload', async () => {
    const [headerB64, , signatureB64] = knownToken.split('.')
    const tamperedPayloadB64 = base64UrlEncode(
      utf8ToBytes(JSON.stringify({ sub: 'tampered' })),
    )
    const tamperedToken = `${headerB64}.${tamperedPayloadB64}.${signatureB64}`
    await expect(verifyJwtHs256(tamperedToken, knownSecret)).resolves.toBe(false)
  })

  it('rejects an HS512 token when verifying as HS256', async () => {
    const token = await makeToken('HS512', { sub: 'user' }, 'secret')
    await expect(verifyJwtHs256(token, 'secret')).resolves.toBe(false)
  })
})

describe('verifyJwtHs512', () => {
  it('verifies an HS512 token with the matching secret', async () => {
    const token = await makeToken('HS512', { sub: 'user' }, 'super-secret')
    await expect(verifyJwtHs512(token, 'super-secret')).resolves.toBe(true)
  })

  it('rejects an HS256 token when verifying as HS512', async () => {
    const token = await makeToken('HS256', { sub: 'user' }, 'super-secret')
    await expect(verifyJwtHs512(token, 'super-secret')).resolves.toBe(false)
  })
})
