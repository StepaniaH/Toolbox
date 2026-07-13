import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  hexToBytes,
  normalizeHexInput,
  utf8ToBytes,
} from './utils.ts'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const DEFAULT_RADIX_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'

export function encodeBase64(text: string, urlSafe?: boolean): string {
  const encoded = bytesToBase64(utf8ToBytes(text))
  if (urlSafe) {
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  return encoded
}

export function decodeBase64(input: string, urlSafe?: boolean): string {
  let normalized = input
  if (urlSafe) {
    normalized = normalized.replace(/-/g, '+').replace(/_/g, '/')
    normalized = normalizeBase64Padding(normalized)
  } else if (normalized.length % 4 !== 0) {
    throw new Error('Invalid base64 input length')
  }
  validateStandardBase64(normalized)
  return bytesToUtf8(base64ToBytes(normalized))
}

export function encodeBase64Url(text: string): string {
  return encodeBase64(text, true)
}

export function decodeBase64Url(input: string): string {
  return decodeBase64(input, true)
}

function normalizeBase64Padding(input: string): string {
  const pad = input.length % 4
  if (pad === 0) return input
  if (pad === 1) throw new Error('Invalid base64 input length')
  return input + '='.repeat(4 - pad)
}

function validateStandardBase64(input: string): void {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input)) {
    throw new Error('Invalid base64 character')
  }
}

export function encodeUrl(text: string): string {
  return globalThis.encodeURI(text)
}

export function decodeUrl(input: string): string {
  return globalThis.decodeURI(input)
}

export function encodeUrlComponent(text: string): string {
  return globalThis.encodeURIComponent(text)
}

export function decodeUrlComponent(input: string): string {
  return globalThis.decodeURIComponent(input)
}

export function encodeHtmlEntities(
  text: string,
  options?: { numeric?: boolean },
): string {
  const numeric = options?.numeric ?? false
  const map = numeric
    ? {
        '&': '&#38;',
        '<': '&#60;',
        '>': '&#62;',
        '"': '&#34;',
        "'": '&#39;',
      }
    : {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      }
  return text.replace(/[&<>"']/g, (ch) => map[ch as keyof typeof map])
}

export function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00A0',
  }

  let output = ''
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (ch !== '&') {
      output += ch
      i += 1
      continue
    }

    const semicolon = input.indexOf(';', i + 1)
    if (semicolon === -1) {
      throw new Error(`Malformed HTML entity at position ${i}`)
    }

    const entity = input.slice(i + 1, semicolon)
    let replacement: string

    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const hex = entity.slice(2)
      if (hex.length === 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
        throw new Error(`Malformed hex HTML entity: &#${entity};`)
      }
      replacement = String.fromCodePoint(Number.parseInt(hex, 16))
    } else if (entity.startsWith('#')) {
      const decimal = entity.slice(1)
      if (decimal.length === 0 || !/^\d+$/.test(decimal)) {
        throw new Error(`Malformed decimal HTML entity: &#${entity};`)
      }
      const code = Number.parseInt(decimal, 10)
      if (code > 0x10FFFF) {
        throw new Error(`Invalid HTML entity code point: ${code}`)
      }
      replacement = String.fromCodePoint(code)
    } else {
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(entity)) {
        throw new Error(`Malformed named HTML entity: &${entity};`)
      }
      const resolved = named[entity]
      if (resolved === undefined) {
        throw new Error(`Unknown HTML entity: &${entity};`)
      }
      replacement = resolved
    }

    output += replacement
    i = semicolon + 1
  }

  return output
}

export function encodeHex(
  text: string,
  options?: { delimiter?: string; prefix?: string },
): string {
  const bytes = utf8ToBytes(text)
  const delimiter = options?.delimiter ?? ''
  const prefix = options?.prefix ?? ''
  return Array.from(bytes, (b) => prefix + b.toString(16).padStart(2, '0')).join(
    delimiter,
  )
}

export function decodeHex(input: string): string {
  const normalized = normalizeHexInput(input)
  if (!/^[0-9a-fA-F]*$/.test(normalized)) {
    throw new Error('Invalid hex character')
  }
  const bytes = hexToBytes(normalized)
  return bytesToUtf8(bytes)
}

export function encodeBase32(text: string): string {
  const bytes = utf8ToBytes(text)
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  while (output.length % 8 !== 0) {
    output += '='
  }

  return output
}

export function decodeBase32(input: string): string {
  const charToIndex = new Map<string, number>()
  for (let i = 0; i < BASE32_ALPHABET.length; i += 1) {
    charToIndex.set(BASE32_ALPHABET[i], i)
  }

  let bits = 0
  let value = 0
  const output: number[] = []
  let paddingStarted = false

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]
    if (ch === '=') {
      paddingStarted = true
      continue
    }
    if (paddingStarted) {
      throw new Error('Invalid base32 padding')
    }
    const index = charToIndex.get(ch)
    if (index === undefined) {
      throw new Error(`Invalid base32 character: ${ch}`)
    }
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return bytesToUtf8(new Uint8Array(output))
}

export function encodeBase58(text: string): string {
  const bytes = utf8ToBytes(text)
  const base = BigInt(58)

  let leadingZeros = 0
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros += 1
  }

  let value = BigInt(0)
  for (const byte of bytes) {
    value = (value << BigInt(8)) | BigInt(byte)
  }

  let result = ''
  while (value > BigInt(0)) {
    const remainder = value % base
    value = value / base
    result = BASE58_ALPHABET[Number(remainder)] + result
  }

  return '1'.repeat(leadingZeros) + result
}

export function decodeBase58(input: string): string {
  const base = BigInt(58)

  let leadingOnes = 0
  while (leadingOnes < input.length && input[leadingOnes] === '1') {
    leadingOnes += 1
  }

  let value = BigInt(0)
  for (let i = leadingOnes; i < input.length; i += 1) {
    const index = BASE58_ALPHABET.indexOf(input[i])
    if (index === -1) {
      throw new Error(`Invalid base58 character: ${input[i]}`)
    }
    value = value * base + BigInt(index)
  }

  let byteCount = 0
  let temp = value
  while (temp > BigInt(0)) {
    byteCount += 1
    temp = temp >> BigInt(8)
  }

  const bytes = new Uint8Array(leadingOnes + byteCount)
  for (let i = bytes.length - 1; i >= leadingOnes; i -= 1) {
    bytes[i] = Number(value & BigInt(255))
    value = value >> BigInt(8)
  }

  return bytesToUtf8(bytes)
}

export function convertRadix(
  value: string,
  fromBase: number,
  toBase: number,
  alphabet?: string,
): string {
  const resolvedAlphabet = alphabet ?? DEFAULT_RADIX_ALPHABET

  if (resolvedAlphabet.length !== new Set(resolvedAlphabet).size) {
    throw new Error('Radix alphabet contains duplicate characters')
  }
  if (fromBase < 2 || fromBase > resolvedAlphabet.length) {
    throw new Error(`Invalid fromBase: ${fromBase}`)
  }
  if (toBase < 2 || toBase > resolvedAlphabet.length) {
    throw new Error(`Invalid toBase: ${toBase}`)
  }
  if (value.length === 0) {
    return ''
  }

  const sourceAlphabet = resolvedAlphabet.slice(0, fromBase)
  for (const ch of value) {
    if (!sourceAlphabet.includes(ch)) {
      throw new Error(`Invalid character "${ch}" for base ${fromBase}`)
    }
  }

  const baseFrom = BigInt(fromBase)
  let num = BigInt(0)
  for (const ch of value) {
    const index = resolvedAlphabet.indexOf(ch)
    num = num * baseFrom + BigInt(index)
  }

  if (num === BigInt(0)) {
    return resolvedAlphabet[0]
  }

  const baseTo = BigInt(toBase)
  let result = ''
  while (num > BigInt(0)) {
    const remainder = num % baseTo
    num = num / baseTo
    result = resolvedAlphabet[Number(remainder)] + result
  }

  return result
}
