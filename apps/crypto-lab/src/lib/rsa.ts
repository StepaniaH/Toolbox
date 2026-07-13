import { base64ToBytes, bytesToBase64, utf8ToBytes, bytesToUtf8 } from './utils.ts'

export type RsaUse = 'encryption' | 'signing'

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

function stripPem(pem: string): string {
  const cleaned = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
    .trim()
  if (cleaned.length === 0) {
    throw new Error('Empty PEM key')
  }
  return cleaned
}

export async function importPublicKeyPem(pem: string, use: RsaUse): Promise<CryptoKey> {
  const der = base64ToBytes(stripPem(pem))
  const usages: KeyUsage[] = use === 'encryption' ? ['encrypt'] : ['verify']
  return crypto.subtle.importKey('spki', asBufferSource(der), getImportAlgorithm(use), true, usages)
}

export async function importPrivateKeyPem(pem: string, use: RsaUse): Promise<CryptoKey> {
  const der = base64ToBytes(stripPem(pem))
  const usages: KeyUsage[] = use === 'encryption' ? ['decrypt'] : ['sign']
  return crypto.subtle.importKey('pkcs8', asBufferSource(der), getImportAlgorithm(use), true, usages)
}

export async function rsaEncrypt(plaintext: string, publicKey: CryptoKey): Promise<string> {
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    asBufferSource(utf8ToBytes(plaintext)),
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
