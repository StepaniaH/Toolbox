import { describe, expect, it } from 'vitest'
import {
  bytesToBase64,
  bytesToHex,
  computeAllHashes,
  digestToBase64,
  digestToHex,
  hmacSha256,
  hmacSha512,
  md5,
  sha1,
  sha256,
  sha3_256,
  sha3_512,
  sha512,
} from './hash.ts'
import { utf8ToBytes } from './utils.ts'

describe('md5', () => {
  it('hashes the empty string', () => {
    expect(bytesToHex(md5(''))).toBe(
      'd41d8cd98f00b204e9800998ecf8427e',
    )
  })

  it('hashes "abc"', () => {
    expect(bytesToHex(md5('abc'))).toBe(
      '900150983cd24fb0d6963f7d28e17f72',
    )
  })

  it('accepts Uint8Array input', () => {
    expect(bytesToHex(md5(utf8ToBytes('abc')))).toBe(
      '900150983cd24fb0d6963f7d28e17f72',
    )
  })
})

describe('sha1', () => {
  it('hashes "abc"', () => {
    expect(bytesToHex(sha1('abc'))).toBe(
      'a9993e364706816aba3e25717850c26c9cd0d89d',
    )
  })

  it('hashes the empty string', () => {
    expect(bytesToHex(sha1(''))).toBe(
      'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    )
  })
})

describe('sha256', () => {
  it('hashes the empty string', async () => {
    expect(bytesToHex(await sha256(''))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('hashes "abc"', async () => {
    expect(bytesToHex(await sha256('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})

describe('sha512', () => {
  it('hashes the empty string', async () => {
    expect(bytesToHex(await sha512(''))).toBe(
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
    )
  })

  it('hashes "abc"', async () => {
    expect(bytesToHex(await sha512('abc'))).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
  })
})

describe('sha3_256', () => {
  it('hashes the empty string', () => {
    expect(bytesToHex(sha3_256(''))).toBe(
      'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
    )
  })

  it('hashes "abc"', () => {
    expect(bytesToHex(sha3_256('abc'))).toBe(
      '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
    )
  })
})

describe('sha3_512', () => {
  it('hashes the empty string', () => {
    expect(bytesToHex(sha3_512(''))).toBe(
      'a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26',
    )
  })

  it('hashes "abc"', () => {
    expect(bytesToHex(sha3_512('abc'))).toBe(
      'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0',
    )
  })
})

describe('digest formatting helpers', () => {
  it('formats digests to hex and base64', () => {
    const digest = md5('abc')
    expect(digestToHex(digest)).toBe(bytesToHex(digest))
    expect(digestToBase64(digest)).toBe(bytesToBase64(digest))
  })
})

describe('hmacSha256', () => {
  it('matches the RFC 4231 test vector', async () => {
    const key = new Uint8Array(20).fill(0x0b)
    const message = utf8ToBytes('Hi There')
    expect(bytesToHex(await hmacSha256(message, key))).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    )
  })

  it('works with string key and message', async () => {
    expect(
      bytesToHex(
        await hmacSha256('The quick brown fox jumps over the lazy dog', 'key'),
      ),
    ).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    )
  })
})

describe('hmacSha512', () => {
  it('matches the RFC 4231 test vector', async () => {
    const key = new Uint8Array(20).fill(0x0b)
    const message = utf8ToBytes('Hi There')
    expect(bytesToHex(await hmacSha512(message, key))).toBe(
      '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854',
    )
  })

  it('works with string key and message', async () => {
    expect(
      bytesToHex(
        await hmacSha512('The quick brown fox jumps over the lazy dog', 'key'),
      ),
    ).toBe(
      'b42af09057bac1e2d41708e48a902e09b5ff7f12ab428a4fe86653c73dd248fb82f948a549f7b791a5b41915ee4d1ec3935357e4e2317250d0372afa2ebeeb3a',
    )
  })
})

describe('computeAllHashes', () => {
  it('returns lower, upper and base64 for every algorithm', async () => {
    const result = await computeAllHashes('abc')

    expect(result.md5.lower).toBe('900150983cd24fb0d6963f7d28e17f72')
    expect(result.md5.upper).toBe('900150983CD24FB0D6963F7D28E17F72')
    expect(result.md5.base64).toBe(bytesToBase64(md5('abc')))

    expect(result.sha1.lower).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    expect(result.sha256.lower).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    expect(result.sha512.lower).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
    expect(result.sha3_256.lower).toBe(
      '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
    )
    expect(result.sha3_512.lower).toBe(
      'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0',
    )
  })
})
