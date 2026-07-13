import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  constantTimeEqual,
  utf8ToBytes,
} from './utils.ts'

export type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string // base64url string
  raw: { header: string; payload: string; signature: string }
}

export function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function base64UrlDecode(str: string): Uint8Array {
  const padded =
    str.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (str.length % 4)) % 4)
  return base64ToBytes(padded)
}

export function decodeJwt(token: string): DecodedJwt {
  if (typeof token !== 'string') {
    throw new Error('JWT must be a string')
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT structure: expected three Base64Url segments')
  }

  const [headerB64, payloadB64, signatureB64] = parts
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid JWT structure: expected three Base64Url segments')
  }

  let header: Record<string, unknown>
  let payload: Record<string, unknown>

  try {
    header = JSON.parse(bytesToUtf8(base64UrlDecode(headerB64))) as Record<
      string,
      unknown
    >
  } catch {
    throw new Error('Invalid JWT header: not valid Base64Url JSON')
  }

  try {
    payload = JSON.parse(bytesToUtf8(base64UrlDecode(payloadB64))) as Record<
      string,
      unknown
    >
  } catch {
    throw new Error('Invalid JWT payload: not valid Base64Url JSON')
  }

  return {
    header,
    payload,
    signature: signatureB64,
    raw: {
      header: headerB64,
      payload: payloadB64,
      signature: signatureB64,
    },
  }
}

type HmacAlgorithm = 'SHA-256' | 'SHA-512'

// Web Crypto's BufferSource expects ArrayBufferView<ArrayBuffer>, but
// TypeScript types Uint8Array as Uint8Array<ArrayBufferLike>. Cast the view
// to the exact expected type without copying.
function toBufferSource(bytes: Uint8Array): ArrayBufferView<ArrayBuffer> {
  return bytes as ArrayBufferView<ArrayBuffer>
}

async function verifyHmac(
  token: string,
  secret: string | Uint8Array,
  hash: HmacAlgorithm,
): Promise<boolean> {
  const expectedAlg = hash === 'SHA-256' ? 'HS256' : 'HS512'
  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  const [headerB64, payloadB64, signatureB64] = parts
  if (!headerB64 || !payloadB64 || !signatureB64) {
    return false
  }

  let header: Record<string, unknown>
  try {
    header = JSON.parse(bytesToUtf8(base64UrlDecode(headerB64))) as Record<
      string,
      unknown
    >
  } catch {
    return false
  }

  if (header.alg !== expectedAlg) {
    return false
  }

  const keyBytes = typeof secret === 'string' ? utf8ToBytes(secret) : secret
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toBufferSource(keyBytes),
    { name: 'HMAC', hash },
    false,
    ['sign'],
  )

  const data = utf8ToBytes(`${headerB64}.${payloadB64}`)
  const computed = new Uint8Array(
    await crypto.subtle.sign('HMAC', cryptoKey, toBufferSource(data)),
  )

  let provided: Uint8Array
  try {
    provided = base64UrlDecode(signatureB64)
  } catch {
    return false
  }

  return constantTimeEqual(computed, provided)
}

export async function verifyJwtHs256(
  token: string,
  secret: string | Uint8Array,
): Promise<boolean> {
  return verifyHmac(token, secret, 'SHA-256')
}

export async function verifyJwtHs512(
  token: string,
  secret: string | Uint8Array,
): Promise<boolean> {
  return verifyHmac(token, secret, 'SHA-512')
}
