import { describe, expect, it } from 'vitest'
import {
  exportPrivateKeyPem,
  exportPublicKeyPem,
  generateRsaKeyPair,
  getPublicKeyFingerprint,
  importPrivateKeyPem,
  importPublicKeyPem,
  rsaOaepMaxMessageBytes,
  rsaDecrypt,
  rsaEncrypt,
  rsaSign,
  rsaVerify,
} from './rsa.ts'

describe('RSA encryption key pair', () => {
  it('generates a 1024-bit key pair', async () => {
    const pair = await generateRsaKeyPair(1024, 'encryption')
    expect(pair.publicKey).toBeDefined()
    expect(pair.privateKey).toBeDefined()
    expect(pair.publicKey.algorithm.name).toBe('RSA-OAEP')
  })

  it('exports and imports PEM for encryption', async () => {
    const pair = await generateRsaKeyPair(1024, 'encryption')
    const publicPem = await exportPublicKeyPem(pair.publicKey)
    const privatePem = await exportPrivateKeyPem(pair.privateKey)
    expect(publicPem).toContain('-----BEGIN PUBLIC KEY-----')
    expect(publicPem).toContain('-----END PUBLIC KEY-----')
    expect(privatePem).toContain('-----BEGIN')
    expect(privatePem).toContain('-----END')

    const importedPublic = await importPublicKeyPem(publicPem, 'encryption')
    const importedPrivate = await importPrivateKeyPem(privatePem, 'encryption')
    expect(importedPublic.algorithm.name).toBe('RSA-OAEP')
    expect(importedPrivate.algorithm.name).toBe('RSA-OAEP')
  })

  it('round-trips encryption and decryption', async () => {
    const pair = await generateRsaKeyPair(1024, 'encryption')
    const plaintext = 'hello RSA-OAEP'
    const ciphertext = await rsaEncrypt(plaintext, pair.publicKey)
    const decrypted = await rsaDecrypt(ciphertext, pair.privateKey)
    expect(decrypted).toBe(plaintext)
  })

  it('derives a stable SHA-256 fingerprint from the canonical public key', async () => {
    const pair = await generateRsaKeyPair(1024, 'encryption')
    const publicPem = await exportPublicKeyPem(pair.publicKey)
    const first = await getPublicKeyFingerprint(publicPem)
    const second = await getPublicKeyFingerprint(`\n${publicPem}\n`)

    expect(first).toBe(second)
    expect(first).toMatch(/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/)
  })

  it('enforces the RFC 8017 OAEP message budget before encryption', async () => {
    const pair = await generateRsaKeyPair(1024, 'encryption')
    expect(rsaOaepMaxMessageBytes(pair.publicKey)).toBe(62)
    await expect(rsaEncrypt('x'.repeat(63), pair.publicKey)).rejects.toMatchObject({
      code: 'message-too-large',
      maxBytes: 62,
    })
  })

  it('rejects oversized and incorrectly labelled PEM input before import', async () => {
    await expect(importPublicKeyPem('x'.repeat(20_000), 'encryption')).rejects.toThrow(/PEM/)
    await expect(importPublicKeyPem('-----BEGIN RSA PUBLIC KEY-----\nAA==\n-----END RSA PUBLIC KEY-----', 'encryption')).rejects.toThrow(/PUBLIC KEY/)
  })
})

describe('RSA signing key pair', () => {
  it('generates a 1024-bit key pair', async () => {
    const pair = await generateRsaKeyPair(1024, 'signing')
    expect(pair.publicKey).toBeDefined()
    expect(pair.privateKey).toBeDefined()
    expect(pair.publicKey.algorithm.name).toBe('RSA-PSS')
  })

  it('exports and imports PEM for signing', async () => {
    const pair = await generateRsaKeyPair(1024, 'signing')
    const publicPem = await exportPublicKeyPem(pair.publicKey)
    const privatePem = await exportPrivateKeyPem(pair.privateKey)
    const importedPublic = await importPublicKeyPem(publicPem, 'signing')
    const importedPrivate = await importPrivateKeyPem(privatePem, 'signing')
    expect(importedPublic.algorithm.name).toBe('RSA-PSS')
    expect(importedPrivate.algorithm.name).toBe('RSA-PSS')
  })

  it('round-trips signing and verification', async () => {
    const pair = await generateRsaKeyPair(1024, 'signing')
    const message = 'sign this message'
    const signature = await rsaSign(message, pair.privateKey)
    const valid = await rsaVerify(message, signature, pair.publicKey)
    expect(valid).toBe(true)
  })

  it('rejects a tampered message', async () => {
    const pair = await generateRsaKeyPair(1024, 'signing')
    const message = 'sign this message'
    const signature = await rsaSign(message, pair.privateKey)
    const valid = await rsaVerify('tampered message', signature, pair.publicKey)
    expect(valid).toBe(false)
  })

  it('signs and verifies Uint8Array messages', async () => {
    const pair = await generateRsaKeyPair(1024, 'signing')
    const message = new Uint8Array([0x00, 0x01, 0x02, 0x03])
    const signature = await rsaSign(message, pair.privateKey)
    const valid = await rsaVerify(message, signature, pair.publicKey)
    expect(valid).toBe(true)
  })
})
