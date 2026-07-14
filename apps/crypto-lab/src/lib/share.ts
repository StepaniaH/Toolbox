import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  utf8ToBytes,
} from './utils.ts'
import { importPrivateKeyPem, importPublicKeyPem } from './rsa.ts'

export const SHARE_PACKET_PREFIX = 'CL1'
export const MAX_SHARE_MESSAGE_BYTES = 1024
export const MAX_SHARE_PACKET_CHARS = 2200

const SHARE_CONTEXT = utf8ToBytes('CryptoLab.Share.v1')
const SHARE_IV_BYTES = 12
const SHARE_KEY_BYTES = 32
const SHARE_TAG_BYTES = 16

export type ShareErrorCode =
  | 'empty-message'
  | 'message-too-large'
  | 'invalid-packet'
  | 'packet-too-large'
  | 'encryption-failed'
  | 'decryption-failed'

export class ShareError extends Error {
  readonly code: ShareErrorCode

  constructor(code: ShareErrorCode) {
    super(code)
    this.name = 'ShareError'
    this.code = code
  }
}

export type SharePacket = {
  wrappedKey: Uint8Array
  iv: Uint8Array
  ciphertext: Uint8Array
}

function asBufferSource(bytes: Uint8Array): ArrayBufferView<ArrayBuffer> {
  return bytes as unknown as ArrayBufferView<ArrayBuffer>
}

function toBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new ShareError('invalid-packet')
  const remainder = value.length % 4
  if (remainder === 1) throw new ShareError('invalid-packet')
  const standard = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - remainder) % 4)
  try {
    const bytes = base64ToBytes(standard)
    if (toBase64Url(bytes) !== value) throw new ShareError('invalid-packet')
    return bytes
  } catch (error) {
    if (error instanceof ShareError) throw error
    throw new ShareError('invalid-packet')
  }
}

export function serializeSharePacket(packet: SharePacket): string {
  const serialized = [
    SHARE_PACKET_PREFIX,
    toBase64Url(packet.wrappedKey),
    toBase64Url(packet.iv),
    toBase64Url(packet.ciphertext),
  ].join('.')
  if (serialized.length > MAX_SHARE_PACKET_CHARS) throw new ShareError('packet-too-large')
  return serialized
}

export function parseSharePacket(input: string): SharePacket {
  const serialized = input.trim()
  if (serialized.length > MAX_SHARE_PACKET_CHARS) throw new ShareError('packet-too-large')
  const parts = serialized.split('.')
  if (parts.length !== 4 || parts[0] !== SHARE_PACKET_PREFIX) {
    throw new ShareError('invalid-packet')
  }
  const wrappedKey = fromBase64Url(parts[1])
  const iv = fromBase64Url(parts[2])
  const ciphertext = fromBase64Url(parts[3])
  if (
    wrappedKey.length < 128
    || wrappedKey.length > 512
    || iv.length !== SHARE_IV_BYTES
    || ciphertext.length < SHARE_TAG_BYTES
    || ciphertext.length > MAX_SHARE_MESSAGE_BYTES + SHARE_TAG_BYTES
  ) {
    throw new ShareError('invalid-packet')
  }
  return { wrappedKey, iv, ciphertext }
}

export async function encryptShareMessage(message: string, publicKeyPem: string): Promise<string> {
  const plaintext = utf8ToBytes(message)
  if (plaintext.length === 0) throw new ShareError('empty-message')
  if (plaintext.length > MAX_SHARE_MESSAGE_BYTES) throw new ShareError('message-too-large')

  try {
    const publicKey = await importPublicKeyPem(publicKeyPem, 'encryption')
    const contentKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )
    const rawContentKey = new Uint8Array(await crypto.subtle.exportKey('raw', contentKey))
    if (rawContentKey.length !== SHARE_KEY_BYTES) throw new ShareError('encryption-failed')
    const iv = crypto.getRandomValues(new Uint8Array(SHARE_IV_BYTES))
    const [wrappedKey, ciphertext] = await Promise.all([
      crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, asBufferSource(rawContentKey)),
      crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: asBufferSource(iv), additionalData: asBufferSource(SHARE_CONTEXT), tagLength: 128 },
        contentKey,
        asBufferSource(plaintext),
      ),
    ])
    return serializeSharePacket({
      wrappedKey: new Uint8Array(wrappedKey),
      iv,
      ciphertext: new Uint8Array(ciphertext),
    })
  } catch (error) {
    if (error instanceof ShareError) throw error
    throw new ShareError('encryption-failed')
  }
}

export async function decryptShareMessage(packetInput: string, privateKeyPem: string): Promise<string> {
  const packet = parseSharePacket(packetInput)
  try {
    const privateKey = await importPrivateKeyPem(privateKeyPem, 'encryption')
    const rawContentKey = new Uint8Array(await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      asBufferSource(packet.wrappedKey),
    ))
    if (rawContentKey.length !== SHARE_KEY_BYTES) throw new ShareError('decryption-failed')
    const contentKey = await crypto.subtle.importKey(
      'raw',
      asBufferSource(rawContentKey),
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    )
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: asBufferSource(packet.iv),
        additionalData: asBufferSource(SHARE_CONTEXT),
        tagLength: 128,
      },
      contentKey,
      asBufferSource(packet.ciphertext),
    )
    return bytesToUtf8(new Uint8Array(plaintext))
  } catch (error) {
    if (error instanceof ShareError) throw error
    throw new ShareError('decryption-failed')
  }
}

export function shareMessageByteLength(message: string): number {
  return utf8ToBytes(message).length
}
