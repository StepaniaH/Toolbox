export function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

export function bytesToBase64(bytes: Uint8Array): string {
  const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return globalThis.btoa(bin)
}

export function base64ToBytes(str: string): Uint8Array {
  const bin = globalThis.atob(str)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i)
  }
  return out
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd length')
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) {
      throw new Error('Invalid hex character')
    }
    bytes[i] = byte
  }
  return bytes
}

export function normalizeHexInput(input: string): string {
  return input
    .replace(/\\x/g, '')
    .replace(/0x/gi, '')
    .replace(/[,;\s]+/g, '')
    .trim()
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } finally {
    textarea.remove()
  }
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}
