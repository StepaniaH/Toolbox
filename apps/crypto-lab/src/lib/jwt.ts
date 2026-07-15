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

export const MAX_JWT_CHARS = 64 * 1024

export type JwtTimeClaim = 'exp' | 'nbf' | 'iat'
export type JwtTimeStatus = 'valid' | 'expired' | 'not-yet-valid' | 'future-issued' | 'invalid'
export type JwtTimeInspection = {
  claim: JwtTimeClaim
  status: JwtTimeStatus
  value?: number
}

export function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function base64UrlDecode(str: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(str)) throw new Error('Invalid Base64Url encoding')
  const padded =
    str.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (str.length % 4)) % 4)
  let decoded: Uint8Array
  try {
    decoded = base64ToBytes(padded)
  } catch {
    throw new Error('Invalid Base64Url encoding')
  }
  if (base64UrlEncode(decoded) !== str) throw new Error('Invalid Base64Url encoding')
  return decoded
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function decodeJwt(token: string): DecodedJwt {
  if (typeof token !== 'string') {
    throw new Error('JWT must be a string')
  }
  if (token.length > MAX_JWT_CHARS) {
    throw new Error('JWT exceeds the safe input limit')
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
    const value: unknown = JSON.parse(bytesToUtf8(base64UrlDecode(headerB64)))
    if (!isJsonObject(value)) throw new Error('JWT header must be a JSON object')
    header = value
  } catch {
    throw new Error('Invalid JWT header: not valid Base64Url JSON')
  }

  try {
    const value: unknown = JSON.parse(bytesToUtf8(base64UrlDecode(payloadB64)))
    if (!isJsonObject(value)) throw new Error('JWT payload must be a JSON object')
    payload = value
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

export function inspectJwtTimeClaims(
  payload: Record<string, unknown>,
  nowSeconds = Date.now() / 1000,
): JwtTimeInspection[] {
  const claims: JwtTimeClaim[] = ['exp', 'nbf', 'iat']
  return claims.flatMap((claim): JwtTimeInspection[] => {
    if (!Object.prototype.hasOwnProperty.call(payload, claim)) return []
    const value = payload[claim]
    if (
      typeof value !== 'number'
      || !Number.isFinite(value)
      || !Number.isFinite(value * 1000)
      || Math.abs(value * 1000) > 8.64e15
    ) {
      return [{ claim, status: 'invalid' }]
    }
    if (claim === 'exp' && nowSeconds >= value) return [{ claim, status: 'expired', value }]
    if (claim === 'nbf' && nowSeconds < value) return [{ claim, status: 'not-yet-valid', value }]
    if (claim === 'iat' && nowSeconds < value) return [{ claim, status: 'future-issued', value }]
    return [{ claim, status: 'valid', value }]
  })
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
