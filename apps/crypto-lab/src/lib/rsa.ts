import { base64ToBytes, bytesToBase64, utf8ToBytes, bytesToUtf8 } from './utils.ts'

export type RsaUse = 'encryption' | 'signing'
export const MAX_RSA_PEM_CHARS = 16 * 1024

export type RsaErrorCode = 'message-too-large'

export class RsaError extends Error {
  readonly code: RsaErrorCode
  readonly maxBytes: number

  constructor(code: RsaErrorCode, maxBytes: number) {
    super(code)
    this.name = 'RsaError'
    this.code = code
    this.maxBytes = maxBytes
  }
}

function asBufferSource(bytes: Uint8Array): ArrayBufferView<ArrayBuffer> {
  return bytes as unknown as ArrayBufferView<ArrayBuffer>
}

function getAlgorithm(use: RsaUse): RsaHashedKeyGenParams {
  if (use === 'encryption') {
    return {
      name: 'RSA-OAEP',
      modulusLength: 0,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    }
  }
  return {
    name: 'RSA-PSS',
    modulusLength: 0,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: 'SHA-256',
  }
}

function getImportAlgorithm(use: RsaUse): AlgorithmIdentifier | RsaHashedImportParams {
  if (use === 'encryption') {
    return { name: 'RSA-OAEP', hash: 'SHA-256' }
  }
  return { name: 'RSA-PSS', hash: 'SHA-256' }
}

export async function generateRsaKeyPair(keySize: 1024 | 2048 | 4096, use: RsaUse): Promise<CryptoKeyPair> {
  const algorithm = getAlgorithm(use)
  algorithm.modulusLength = keySize
  const usages: KeyUsage[] = use === 'encryption' ? ['encrypt', 'decrypt'] : ['sign', 'verify']
  return crypto.subtle.generateKey(algorithm, true, usages)
}

function pemLines(label: string, data: string): string {
  const lines: string[] = []
  for (let i = 0; i < data.length; i += 64) {
    lines.push(data.slice(i, i + 64))
  }
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`
}

export async function exportPublicKeyPem(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key)
  return pemLines('PUBLIC KEY', bytesToBase64(new Uint8Array(exported)))
}

export async function exportPrivateKeyPem(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', key)
  return pemLines('PRIVATE KEY', bytesToBase64(new Uint8Array(exported)))
}

function stripPem(pem: string, label: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
  if (pem.length > MAX_RSA_PEM_CHARS) throw new Error('PEM exceeds the safe input limit')
  const match = pem.trim().match(new RegExp(
    `^-----BEGIN ${label}-----\\s+([A-Za-z0-9+/=\\s]+)\\s+-----END ${label}-----$`,
  ))
  if (!match) throw new Error(`Expected a ${label} PEM block`)
  const body = match[1].replace(/\s+/g, '')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body) || body.length % 4 !== 0) {
    throw new Error(`Invalid ${label} PEM encoding`)
  }
  return body
}

export async function importPublicKeyPem(pem: string, use: RsaUse): Promise<CryptoKey> {
  const der = base64ToBytes(stripPem(pem, 'PUBLIC KEY'))
  const usages: KeyUsage[] = use === 'encryption' ? ['encrypt'] : ['verify']
  return crypto.subtle.importKey('spki', asBufferSource(der), getImportAlgorithm(use), true, usages)
}

export async function importPrivateKeyPem(pem: string, use: RsaUse): Promise<CryptoKey> {
  const der = base64ToBytes(stripPem(pem, 'PRIVATE KEY'))
  const usages: KeyUsage[] = use === 'encryption' ? ['decrypt'] : ['sign']
  return crypto.subtle.importKey('pkcs8', asBufferSource(der), getImportAlgorithm(use), true, usages)
}

function hashByteLength(hashName: string): number {
  const lengths: Record<string, number> = {
    'SHA-1': 20,
    'SHA-256': 32,
    'SHA-384': 48,
    'SHA-512': 64,
  }
  const length = lengths[hashName]
  if (!length) throw new Error(`Unsupported RSA hash: ${hashName}`)
  return length
}

export function rsaOaepMaxMessageBytes(key: CryptoKey): number {
  if (key.algorithm.name !== 'RSA-OAEP') throw new Error('Expected an RSA-OAEP key')
  const algorithm = key.algorithm as RsaHashedKeyAlgorithm
  const modulusBytes = Math.ceil(algorithm.modulusLength / 8)
  const digestBytes = hashByteLength(algorithm.hash.name)
  return modulusBytes - (2 * digestBytes) - 2
}

export function rsaOaepMaxMessageBytesForBits(modulusLength: number): number {
  return Math.ceil(modulusLength / 8) - (2 * 32) - 2
}

export async function getPublicKeyFingerprint(pem: string): Promise<string> {
  const key = await importPublicKeyPem(pem, 'encryption')
  const canonicalSpki = await crypto.subtle.exportKey('spki', key)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', canonicalSpki))
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(':')
}

export async function rsaEncrypt(plaintext: string, publicKey: CryptoKey): Promise<string> {
  const message = utf8ToBytes(plaintext)
  const maxBytes = rsaOaepMaxMessageBytes(publicKey)
  if (message.length > maxBytes) throw new RsaError('message-too-large', maxBytes)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    asBufferSource(message),
  )
  return bytesToBase64(new Uint8Array(ciphertext))
}

export async function rsaDecrypt(ciphertextBase64: string, privateKey: CryptoKey): Promise<string> {
  const ciphertext = base64ToBytes(ciphertextBase64)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    asBufferSource(ciphertext),
  )
  return bytesToUtf8(new Uint8Array(plaintext))
}

export async function rsaSign(message: string | Uint8Array, privateKey: CryptoKey): Promise<string> {
  const data = typeof message === 'string' ? utf8ToBytes(message) : message
  const signature = await crypto.subtle.sign(
    { name: 'RSA-PSS', saltLength: 32 },
    privateKey,
    asBufferSource(data),
  )
  return bytesToBase64(new Uint8Array(signature))
}

export async function rsaVerify(
  message: string | Uint8Array,
  signatureBase64: string,
  publicKey: CryptoKey,
): Promise<boolean> {
  const data = typeof message === 'string' ? utf8ToBytes(message) : message
  const signature = base64ToBytes(signatureBase64)
  try {
    return await crypto.subtle.verify(
      { name: 'RSA-PSS', saltLength: 32 },
      publicKey,
      asBufferSource(signature),
      asBufferSource(data),
    )
  } catch {
    return false
  }
}
