import { bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8 } from './utils.ts'

function asBufferSource(bytes: Uint8Array): ArrayBufferView<ArrayBuffer> {
  return bytes as unknown as ArrayBufferView<ArrayBuffer>
}

function parseHex(label: string, hex: string, validLengths: number[]): Uint8Array {
  const bytes = hexToBytes(hex)
  if (!validLengths.includes(bytes.length)) {
    const lengths = validLengths.map((l) => `${l} bytes`).join(' or ')
    throw new Error(`${label} must be ${lengths} (got ${bytes.length})`)
  }
  return bytes
}

export async function aesGcmEncrypt(plaintext: string, keyHex: string, ivHex: string): Promise<string> {
  const keyBytes = parseHex('AES-GCM key', keyHex, [16, 24, 32])
  const ivBytes = parseHex('AES-GCM IV', ivHex, [12])
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(keyBytes),
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  )
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asBufferSource(ivBytes), tagLength: 128 },
    cryptoKey,
    asBufferSource(utf8ToBytes(plaintext)),
  )
  return bytesToHex(new Uint8Array(ciphertext))
}

export async function aesGcmDecrypt(ciphertextHex: string, keyHex: string, ivHex: string): Promise<string> {
  const keyBytes = parseHex('AES-GCM key', keyHex, [16, 24, 32])
  const ivBytes = parseHex('AES-GCM IV', ivHex, [12])
  const ciphertext = hexToBytes(ciphertextHex)
  if (ciphertext.length < 16) {
    throw new Error('AES-GCM ciphertext too short')
  }
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(keyBytes),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  )
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: asBufferSource(ivBytes), tagLength: 128 },
      cryptoKey,
      asBufferSource(ciphertext),
    )
    return bytesToUtf8(new Uint8Array(plaintext))
  } catch {
    throw new Error('AES-GCM decryption failed')
  }
}

export async function aesCbcEncrypt(plaintext: string, keyHex: string, ivHex: string): Promise<string> {
  const keyBytes = parseHex('AES-CBC key', keyHex, [16, 24, 32])
  const ivBytes = parseHex('AES-CBC IV', ivHex, [16])
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(keyBytes),
    { name: 'AES-CBC' },
    false,
    ['encrypt'],
  )
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: asBufferSource(ivBytes) },
    cryptoKey,
    asBufferSource(utf8ToBytes(plaintext)),
  )
  return bytesToHex(new Uint8Array(ciphertext))
}

export async function aesCbcDecrypt(ciphertextHex: string, keyHex: string, ivHex: string): Promise<string> {
  const keyBytes = parseHex('AES-CBC key', keyHex, [16, 24, 32])
  const ivBytes = parseHex('AES-CBC IV', ivHex, [16])
  const ciphertext = hexToBytes(ciphertextHex)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(keyBytes),
    { name: 'AES-CBC' },
    false,
    ['decrypt'],
  )
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: asBufferSource(ivBytes) },
      cryptoKey,
      asBufferSource(ciphertext),
    )
    return bytesToUtf8(new Uint8Array(plaintext))
  } catch {
    throw new Error('AES-CBC decryption failed')
  }
}

function chachaQuarterRound(
  x: Uint32Array,
  a: number,
  b: number,
  c: number,
  d: number,
): void {
  x[a] = (x[a] + x[b]) | 0
  x[d] = rotl(x[d] ^ x[a], 16)
  x[c] = (x[c] + x[d]) | 0
  x[b] = rotl(x[b] ^ x[c], 12)
  x[a] = (x[a] + x[b]) | 0
  x[d] = rotl(x[d] ^ x[a], 8)
  x[c] = (x[c] + x[d]) | 0
  x[b] = rotl(x[b] ^ x[c], 7)
}

function rotl(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) | 0
}

function chacha20Block(key: Uint8Array, nonce: Uint8Array, counter: number): Uint8Array {
  const state = new Uint32Array(16)
  state[0] = 0x61707865
  state[1] = 0x3320646e
  state[2] = 0x79622d32
  state[3] = 0x6b206574
  for (let i = 0; i < 8; i += 1) {
    state[4 + i] = readUint32LE(key, i * 4)
  }
  state[12] = counter
  for (let i = 0; i < 3; i += 1) {
    state[13 + i] = readUint32LE(nonce, i * 4)
  }

  const working = new Uint32Array(state)
  for (let i = 0; i < 10; i += 1) {
    chachaQuarterRound(working, 0, 4, 8, 12)
    chachaQuarterRound(working, 1, 5, 9, 13)
    chachaQuarterRound(working, 2, 6, 10, 14)
    chachaQuarterRound(working, 3, 7, 11, 15)
    chachaQuarterRound(working, 0, 5, 10, 15)
    chachaQuarterRound(working, 1, 6, 11, 12)
    chachaQuarterRound(working, 2, 7, 8, 13)
    chachaQuarterRound(working, 3, 4, 9, 14)
  }

  for (let i = 0; i < 16; i += 1) {
    working[i] = (working[i] + state[i]) | 0
  }

  const out = new Uint8Array(64)
  for (let i = 0; i < 16; i += 1) {
    writeUint32LE(out, i * 4, working[i])
  }
  return out
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  )
}

function writeUint32LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff
  bytes[offset + 1] = (value >>> 8) & 0xff
  bytes[offset + 2] = (value >>> 16) & 0xff
  bytes[offset + 3] = (value >>> 24) & 0xff
}

function chacha20Crypt(input: Uint8Array, keyHex: string, nonceHex: string): Uint8Array {
  const key = parseHex('ChaCha20 key', keyHex, [32])
  const nonce = parseHex('ChaCha20 nonce', nonceHex, [12])
  const output = new Uint8Array(input.length)
  let counter = 1
  for (let offset = 0; offset < input.length; offset += 64) {
    const keystream = chacha20Block(key, nonce, counter)
    counter += 1
    const blockLength = Math.min(64, input.length - offset)
    for (let i = 0; i < blockLength; i += 1) {
      output[offset + i] = input[offset + i] ^ keystream[i]
    }
  }
  return output
}

export function chacha20Encrypt(plaintext: string, keyHex: string, nonceHex: string): string {
  return bytesToHex(chacha20Crypt(utf8ToBytes(plaintext), keyHex, nonceHex))
}

export function chacha20Decrypt(ciphertextHex: string, keyHex: string, nonceHex: string): string {
  return bytesToUtf8(chacha20Crypt(hexToBytes(ciphertextHex), keyHex, nonceHex))
}
