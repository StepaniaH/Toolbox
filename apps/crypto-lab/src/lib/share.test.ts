import { beforeAll, describe, expect, it } from 'vitest'
import {
  exportPrivateKeyPem,
  exportPublicKeyPem,
  generateRsaKeyPair,
} from './rsa.ts'
import {
  decryptShareMessage,
  encryptShareMessage,
  MAX_SHARE_MESSAGE_BYTES,
  parseSharePacket,
  serializeSharePacket,
  ShareError,
} from './share.ts'

let publicKeyPem = ''
let privateKeyPem = ''

beforeAll(async () => {
  const pair = await generateRsaKeyPair(1024, 'encryption')
  ;[publicKeyPem, privateKeyPem] = await Promise.all([
    exportPublicKeyPem(pair.publicKey),
    exportPrivateKeyPem(pair.privateKey),
  ])
})

describe('CL1 secure share packet', () => {
  it('round-trips authenticated unicode content without exposing plaintext', async () => {
    const message = '只给收件人看的消息 🔐'
    const packet = await encryptShareMessage(message, publicKeyPem)
    const parsed = parseSharePacket(packet)

    expect(packet.startsWith('CL1.')).toBe(true)
    expect(packet).not.toContain(message)
    expect(parsed.iv).toHaveLength(12)
    expect(parsed.wrappedKey).toHaveLength(128)
    expect(await decryptShareMessage(packet, privateKeyPem)).toBe(message)
  })

  it('uses fresh randomness for identical messages', async () => {
    const first = await encryptShareMessage('same message', publicKeyPem)
    const second = await encryptShareMessage('same message', publicKeyPem)
    expect(second).not.toBe(first)
  })

  it('rejects ciphertext tampering with a generic failure', async () => {
    const packet = await encryptShareMessage('authenticated', publicKeyPem)
    const parsed = parseSharePacket(packet)
    parsed.ciphertext[0] ^= 1
    const tampered = serializeSharePacket(parsed)
    await expect(decryptShareMessage(tampered, privateKeyPem)).rejects.toMatchObject({
      code: 'decryption-failed',
    })
  })

  it('rejects a different recipient private key', async () => {
    const otherPair = await generateRsaKeyPair(1024, 'encryption')
    const otherPrivateKey = await exportPrivateKeyPem(otherPair.privateKey)
    const packet = await encryptShareMessage('recipient-bound', publicKeyPem)
    await expect(decryptShareMessage(packet, otherPrivateKey)).rejects.toMatchObject({
      code: 'decryption-failed',
    })
  })

  it('enforces message and packet limits before expensive cryptography', async () => {
    await expect(encryptShareMessage('', publicKeyPem)).rejects.toMatchObject({ code: 'empty-message' })
    await expect(
      encryptShareMessage('x'.repeat(MAX_SHARE_MESSAGE_BYTES + 1), publicKeyPem),
    ).rejects.toMatchObject({ code: 'message-too-large' })
    expect(() => parseSharePacket(`CL1.${'A'.repeat(2300)}.AA.AA`)).toThrow(ShareError)
  })

  it('rejects malformed and non-canonical Base64URL fields', () => {
    expect(() => parseSharePacket('CL2.AA.AA.AA')).toThrow(ShareError)
    expect(() => parseSharePacket('CL1.A=.AA.AA')).toThrow(ShareError)
    expect(() => parseSharePacket('CL1.AA.AA')).toThrow(ShareError)
  })
})
