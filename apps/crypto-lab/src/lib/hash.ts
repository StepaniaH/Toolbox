import { bytesToBase64, bytesToHex, utf8ToBytes } from './utils.ts'

export { bytesToBase64, bytesToHex } from './utils.ts'

function toBytes(input: string | Uint8Array): Uint8Array {
  return typeof input === 'string' ? utf8ToBytes(input) : input
}

function leftRotate(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0
}

const MD5_K = new Uint32Array([
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
  0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
  0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
  0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
  0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
  0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
  0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
  0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
  0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
])

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
  9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
  15, 21,
]

export function md5(input: string | Uint8Array): Uint8Array {
  const message = toBytes(input)
  const s = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]

  const totalBits = BigInt(message.length) * 8n
  const padLen = (message.length + 9 + 63) & ~63
  const padded = new Uint8Array(padLen)
  padded.set(message)
  padded[message.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setBigUint64(padLen - 8, totalBits, true)

  for (let offset = 0; offset < padLen; offset += 64) {
    const w = new Uint32Array(16)
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, true)
    }
    let a = s[0]
    let b = s[1]
    let c = s[2]
    let d = s[3]
    for (let i = 0; i < 64; i += 1) {
      let f: number
      let g: number
      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }
      const temp = d
      d = c
      c = b
      b = (b + leftRotate(a + f + MD5_K[i] + w[g], MD5_S[i])) >>> 0
      a = temp
    }
    s[0] = (s[0] + a) >>> 0
    s[1] = (s[1] + b) >>> 0
    s[2] = (s[2] + c) >>> 0
    s[3] = (s[3] + d) >>> 0
  }

  const digest = new Uint8Array(16)
  const digestView = new DataView(digest.buffer)
  for (let i = 0; i < 4; i += 1) {
    digestView.setUint32(i * 4, s[i], true)
  }
  return digest
}

export function sha1(input: string | Uint8Array): Uint8Array {
  const message = toBytes(input)
  const h = [
    0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0,
  ]

  const totalBits = BigInt(message.length) * 8n
  const padLen = (message.length + 9 + 63) & ~63
  const padded = new Uint8Array(padLen)
  padded.set(message)
  padded[message.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setBigUint64(padLen - 8, totalBits, false)

  for (let offset = 0; offset < padLen; offset += 64) {
    const w = new Uint32Array(80)
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false)
    }
    for (let i = 16; i < 80; i += 1) {
      w[i] = leftRotate(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1)
    }
    let a = h[0]
    let b = h[1]
    let c = h[2]
    let d = h[3]
    let e = h[4]
    for (let i = 0; i < 80; i += 1) {
      let f: number
      let k: number
      if (i < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (i < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const temp = (leftRotate(a, 5) + f + e + k + w[i]) >>> 0
      e = d
      d = c
      c = leftRotate(b, 30)
      b = a
      a = temp
    }
    h[0] = (h[0] + a) >>> 0
    h[1] = (h[1] + b) >>> 0
    h[2] = (h[2] + c) >>> 0
    h[3] = (h[3] + d) >>> 0
    h[4] = (h[4] + e) >>> 0
  }

  const digest = new Uint8Array(20)
  const digestView = new DataView(digest.buffer)
  for (let i = 0; i < 5; i += 1) {
    digestView.setUint32(i * 4, h[i], false)
  }
  return digest
}

function asBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as BufferSource
}

export async function sha256(
  input: string | Uint8Array,
): Promise<Uint8Array> {
  const message = toBytes(input)
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    asBufferSource(message),
  )
  return new Uint8Array(buffer)
}

export async function sha512(
  input: string | Uint8Array,
): Promise<Uint8Array> {
  const message = toBytes(input)
  const buffer = await crypto.subtle.digest(
    'SHA-512',
    asBufferSource(message),
  )
  return new Uint8Array(buffer)
}

const KECCAK_RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
  0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
]

const ROTC = [
  [0, 1, 62, 28, 27],
  [36, 44, 6, 55, 20],
  [3, 10, 43, 25, 39],
  [41, 45, 15, 21, 8],
  [18, 2, 61, 56, 14],
]

const MASK64 = (1n << 64n) - 1n

function rotl64(value: bigint, bits: number): bigint {
  const n = bits % 64
  return ((value << BigInt(n)) | (value >> BigInt(64 - n))) & MASK64
}

function keccakF1600(state: bigint[]): void {
  for (let round = 0; round < 24; round += 1) {
    const c = Array.from({ length: 5 }, () => 0n) as bigint[]
    for (let x = 0; x < 5; x += 1) {
      c[x] =
        state[x] ^
        state[x + 5] ^
        state[x + 10] ^
        state[x + 15] ^
        state[x + 20]
    }
    const d = Array.from({ length: 5 }, () => 0n) as bigint[]
    for (let x = 0; x < 5; x += 1) {
      d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1)
    }
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y] ^= d[x]
      }
    }

    const b = Array.from({ length: 25 }, () => 0n) as bigint[]
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(
          state[x + 5 * y],
          ROTC[y][x],
        )
      }
    }

    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        const index = x + 5 * y
        state[index] =
          b[index] ^
          ((~b[((x + 1) % 5) + 5 * y]) & MASK64) &
          b[((x + 2) % 5) + 5 * y]
      }
    }

    state[0] ^= KECCAK_RC[round]
  }
}

function keccakDigest(input: Uint8Array, outputBits: number): Uint8Array {
  const outputBytes = outputBits / 8
  const capacityBits = outputBits * 2
  const rateBits = 1600 - capacityBits
  const rateBytes = rateBits / 8

  const state = Array.from({ length: 25 }, () => 0n) as bigint[]

  let offset = 0
  while (offset < input.length) {
    const blockLength = Math.min(rateBytes, input.length - offset)
    for (let i = 0; i < blockLength; i += 1) {
      const laneIndex = i >>> 3
      const byteInLane = i & 7
      state[laneIndex] ^=
        BigInt(input[offset + i]) << BigInt(byteInLane * 8)
    }
    offset += blockLength
    if (blockLength === rateBytes) {
      keccakF1600(state)
    } else {
      state[blockLength >>> 3] ^=
        0x06n << BigInt((blockLength & 7) * 8)
      state[(rateBytes - 1) >>> 3] ^=
        0x80n << BigInt(((rateBytes - 1) & 7) * 8)
      keccakF1600(state)
      break
    }
  }

  if (input.length % rateBytes === 0) {
    state[0] ^= 0x06n
    state[(rateBytes - 1) >>> 3] ^=
      0x80n << BigInt(((rateBytes - 1) & 7) * 8)
    keccakF1600(state)
  }

  const digest = new Uint8Array(outputBytes)
  for (let i = 0; i < outputBytes; i += 1) {
    const laneIndex = i >>> 3
    const byteInLane = i & 7
    digest[i] = Number(
      (state[laneIndex] >> BigInt(byteInLane * 8)) & 0xffn,
    )
  }
  return digest
}

export function sha3_256(input: string | Uint8Array): Uint8Array {
  return keccakDigest(toBytes(input), 256)
}

export function sha3_512(input: string | Uint8Array): Uint8Array {
  return keccakDigest(toBytes(input), 512)
}

export function digestToHex(digest: Uint8Array): string {
  return bytesToHex(digest)
}

export function digestToBase64(digest: Uint8Array): string {
  return bytesToBase64(digest)
}

export async function hmacSha256(
  message: string | Uint8Array,
  key: string | Uint8Array,
): Promise<Uint8Array> {
  return hmac(message, key, 'SHA-256')
}

export async function hmacSha512(
  message: string | Uint8Array,
  key: string | Uint8Array,
): Promise<Uint8Array> {
  return hmac(message, key, 'SHA-512')
}

async function hmac(
  message: string | Uint8Array,
  key: string | Uint8Array,
  hash: 'SHA-256' | 'SHA-512',
): Promise<Uint8Array> {
  const keyBytes = toBytes(key)
  const messageBytes = toBytes(message)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(keyBytes),
    { name: 'HMAC', hash },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    asBufferSource(messageBytes),
  )
  return new Uint8Array(signature)
}

function hashFormats(digest: Uint8Array): {
  lower: string
  upper: string
  base64: string
} {
  const lower = bytesToHex(digest)
  return {
    lower,
    upper: lower.toUpperCase(),
    base64: bytesToBase64(digest),
  }
}

export async function computeAllHashes(
  input: string | Uint8Array,
): Promise<{
  md5: { lower: string; upper: string; base64: string }
  sha1: { lower: string; upper: string; base64: string }
  sha256: { lower: string; upper: string; base64: string }
  sha512: { lower: string; upper: string; base64: string }
  sha3_256: { lower: string; upper: string; base64: string }
  sha3_512: { lower: string; upper: string; base64: string }
}> {
  const bytes = toBytes(input)
  const [sha256Digest, sha512Digest] = await Promise.all([
    sha256(bytes),
    sha512(bytes),
  ])

  return {
    md5: hashFormats(md5(bytes)),
    sha1: hashFormats(sha1(bytes)),
    sha256: hashFormats(sha256Digest),
    sha512: hashFormats(sha512Digest),
    sha3_256: hashFormats(sha3_256(bytes)),
    sha3_512: hashFormats(sha3_512(bytes)),
  }
}
