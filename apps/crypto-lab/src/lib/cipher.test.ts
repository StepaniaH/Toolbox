import { describe, expect, it } from 'vitest'
import { hexToBytes } from './utils.ts'
import {
  aesCbcDecrypt,
  aesCbcEncrypt,
  aesGcmDecrypt,
  aesGcmEncrypt,
  chacha20Decrypt,
  chacha20Encrypt,
} from './cipher.ts'

const aes128Key = '000102030405060708090a0b0c0d0e0f'
const aes192Key = '000102030405060708090a0b0c0d0e0f1011121314151617'
const aes256Key = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
const gcmIv = '000000000000000000000000'
const cbcIv = '000102030405060708090a0b0c0d0e0f'
const chachaKey = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
const chachaNonce = '000000000000000000000000'

describe('AES-GCM', () => {
  it('round-trips plaintext with a 128-bit key', async () => {
    const plaintext = 'hello world'
    const ciphertext = await aesGcmEncrypt(plaintext, aes128Key, gcmIv)
    const decrypted = await aesGcmDecrypt(ciphertext, aes128Key, gcmIv)
    expect(decrypted).toBe(plaintext)
  })

  it('round-trips plaintext with a 192-bit key', async () => {
    const plaintext = 'Toolbox crypto lab'
    const ciphertext = await aesGcmEncrypt(plaintext, aes192Key, gcmIv)
    const decrypted = await aesGcmDecrypt(ciphertext, aes192Key, gcmIv)
    expect(decrypted).toBe(plaintext)
  })

  it('round-trips plaintext with a 256-bit key', async () => {
    const plaintext = 'UTF-8: 你好，世界 🌍'
    const ciphertext = await aesGcmEncrypt(plaintext, aes256Key, gcmIv)
    const decrypted = await aesGcmDecrypt(ciphertext, aes256Key, gcmIv)
    expect(decrypted).toBe(plaintext)
  })

  it('fails decryption with the wrong key', async () => {
    const ciphertext = await aesGcmEncrypt('secret', aes128Key, gcmIv)
    const wrongKey = 'ff' + aes128Key.slice(2)
    await expect(aesGcmDecrypt(ciphertext, wrongKey, gcmIv)).rejects.toThrow('AES-GCM decryption failed')
  })

  it('throws for invalid key length', async () => {
    await expect(aesGcmEncrypt('x', '001122', gcmIv)).rejects.toThrow('AES-GCM key must be 16 bytes or 24 bytes or 32 bytes')
  })

  it('throws for invalid IV length', async () => {
    await expect(aesGcmEncrypt('x', aes128Key, cbcIv)).rejects.toThrow('AES-GCM IV must be 12 bytes')
  })
})

describe('AES-CBC', () => {
  it('round-trips plaintext with a 128-bit key', async () => {
    const plaintext = 'hello world'
    const ciphertext = await aesCbcEncrypt(plaintext, aes128Key, cbcIv)
    const decrypted = await aesCbcDecrypt(ciphertext, aes128Key, cbcIv)
    expect(decrypted).toBe(plaintext)
  })

  it('round-trips plaintext with a 256-bit key and UTF-8', async () => {
    const plaintext = 'こんにちは 🌸'
    const ciphertext = await aesCbcEncrypt(plaintext, aes256Key, cbcIv)
    const decrypted = await aesCbcDecrypt(ciphertext, aes256Key, cbcIv)
    expect(decrypted).toBe(plaintext)
  })

  it('fails decryption with the wrong key', async () => {
    const ciphertext = await aesCbcEncrypt('secret', aes128Key, cbcIv)
    const wrongKey = 'ff' + aes128Key.slice(2)
    await expect(aesCbcDecrypt(ciphertext, wrongKey, cbcIv)).rejects.toThrow('AES-CBC decryption failed')
  })

  it('throws for invalid IV length', async () => {
    await expect(aesCbcEncrypt('x', aes128Key, gcmIv)).rejects.toThrow('AES-CBC IV must be 16 bytes')
  })
})

describe('ChaCha20', () => {
  it('round-trips plaintext', () => {
    const plaintext = 'The quick brown fox jumps over the lazy dog'
    const ciphertext = chacha20Encrypt(plaintext, chachaKey, chachaNonce)
    const decrypted = chacha20Decrypt(ciphertext, chachaKey, chachaNonce)
    expect(decrypted).toBe(plaintext)
  })

  it('produces the RFC 8439 test vector', () => {
    const key = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
    const nonce = '000000000000004a00000000'
    const plaintextHex =
      '4c616469657320616e642047656e746c656d656e206f662074686520636c617373206f66202739393a204966204920636f756c64206f6666657220796f75206f6e6c79206f6e652074697020666f7220746865206675747572652c2073756e73637265656e20776f756c642062652069742e'
    const expectedCiphertext =
      '6e2e359a2568f98041ba0728dd0d6981e97e7aec1d4360c20a27afccfd9fae0bf91b65c5524733ab8f593dabcd62b3571639d624e65152ab8f530c359f0861d807ca0dbf500d6a6156a38e088a22b65e52bc514d16ccf806818ce91ab77937365af90bbf74a35be6b40b8eedf2785e42874d'
    const ciphertext = chacha20Encrypt(new TextDecoder().decode(hexToBytes(plaintextHex)), key, nonce)
    expect(ciphertext).toBe(expectedCiphertext)
  })

  it('fails decryption with the wrong key', () => {
    const ciphertext = chacha20Encrypt('secret', chachaKey, chachaNonce)
    const wrongKey = 'ff' + chachaKey.slice(2)
    expect(chacha20Decrypt(ciphertext, wrongKey, chachaNonce)).not.toBe('secret')
  })

  it('throws for invalid key length', () => {
    expect(() => chacha20Encrypt('x', '001122', chachaNonce)).toThrow('ChaCha20 key must be 32 bytes')
  })

  it('throws for invalid nonce length', () => {
    expect(() => chacha20Encrypt('x', chachaKey, cbcIv)).toThrow('ChaCha20 nonce must be 12 bytes')
  })
})
