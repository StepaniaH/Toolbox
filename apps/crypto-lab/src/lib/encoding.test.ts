import { describe, expect, it } from 'vitest'
import {
  convertRadix,
  decodeBase32,
  decodeBase58,
  decodeBase64,
  decodeBase64Url,
  decodeHex,
  decodeHtmlEntities,
  decodeUrl,
  decodeUrlComponent,
  encodeBase32,
  encodeBase58,
  encodeBase64,
  encodeBase64Url,
  encodeHex,
  encodeHtmlEntities,
  encodeUrl,
  encodeUrlComponent,
} from './encoding.ts'

describe('base64', () => {
  it('encodes and decodes ASCII text', () => {
    const text = 'Hello, World!'
    const encoded = encodeBase64(text)
    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==')
    expect(decodeBase64(encoded)).toBe(text)
  })

  it('round-trips unicode text', () => {
    const text = '你好，世界 🌍'
    expect(decodeBase64(encodeBase64(text))).toBe(text)
  })

  it('round-trips empty string', () => {
    expect(encodeBase64('')).toBe('')
    expect(decodeBase64('')).toBe('')
  })

  it('produces url-safe output without padding', () => {
    const text = '>>?'
    const standard = encodeBase64(text)
    expect(standard).toBe('Pj4/')
    const urlSafe = encodeBase64(text, true)
    expect(urlSafe).toBe('Pj4_')
    expect(decodeBase64(urlSafe, true)).toBe(text)
  })

  it('decodes url-safe input with missing padding', () => {
    expect(decodeBase64('Pj4_', true)).toBe('>>?')
  })

  it('throws on invalid base64 characters', () => {
    expect(() => decodeBase64('Pj4!')).toThrow('Invalid base64 character')
  })

  it('throws on invalid base64 length', () => {
    expect(() => decodeBase64('SGVsbG8sIFdvcmxkIQ')).toThrow(
      'Invalid base64 input length',
    )
  })
})

describe('base64url', () => {
  it('round-trips text', () => {
    const text = 'base64/url+safe=value'
    expect(decodeBase64Url(encodeBase64Url(text))).toBe(text)
  })
})

describe('url', () => {
  it('encodes and decodes full URIs', () => {
    const url = 'https://example.com/path?a=1&b=2'
    expect(encodeUrl(url)).toBe(url)
    expect(decodeUrl(url)).toBe(url)
  })

  it('encodes reserved characters in components', () => {
    const text = 'hello world & more'
    expect(encodeUrl(text)).toBe('hello%20world%20&%20more')
  })
})

describe('url component', () => {
  it('encodes and decodes components', () => {
    const text = 'a=b&c=d'
    expect(encodeUrlComponent(text)).toBe('a%3Db%26c%3Dd')
    expect(decodeUrlComponent('a%3Db%26c%3Dd')).toBe(text)
  })
})

describe('html entities', () => {
  it('encodes core characters to named entities', () => {
    expect(encodeHtmlEntities(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&apos;')
  })

  it('encodes core characters to numeric entities', () => {
    expect(encodeHtmlEntities(`<&>"'`, { numeric: true })).toBe(
      '&#60;&#38;&#62;&#34;&#39;',
    )
  })

  it('decodes named entities', () => {
    expect(decodeHtmlEntities('&lt;&amp;&gt;&quot;&apos;&nbsp;')).toBe(
      `<&>"'\u00A0`,
    )
  })

  it('decodes decimal numeric entities', () => {
    expect(decodeHtmlEntities('&#60;&#38;&#62;')).toBe('<&>')
  })

  it('decodes hex numeric entities', () => {
    expect(decodeHtmlEntities('&#x3C;&#x26;&#x3E;')).toBe('<&>')
  })

  it('round-trips named encoding', () => {
    const text = `Tom & Jerry said "Hello"`
    expect(decodeHtmlEntities(encodeHtmlEntities(text))).toBe(text)
  })

  it('round-trips numeric encoding', () => {
    const text = `Tom & Jerry said "Hello"`
    expect(decodeHtmlEntities(encodeHtmlEntities(text, { numeric: true }))).toBe(
      text,
    )
  })

  it('throws on malformed entities', () => {
    expect(() => decodeHtmlEntities('not &valid')).toThrow(
      'Malformed HTML entity',
    )
  })

  it('throws on unknown named entities', () => {
    expect(() => decodeHtmlEntities('&copy;')).toThrow('Unknown HTML entity')
  })
})

describe('hex', () => {
  it('encodes and decodes UTF-8 bytes', () => {
    const text = 'Hello'
    expect(encodeHex(text)).toBe('48656c6c6f')
    expect(decodeHex('48656c6c6f')).toBe(text)
  })

  it('round-trips unicode text', () => {
    const text = '你好'
    expect(decodeHex(encodeHex(text))).toBe(text)
  })

  it('supports delimiter and prefix', () => {
    expect(encodeHex('Hi', { delimiter: ':', prefix: '0x' })).toBe(
      '0x48:0x69',
    )
  })

  it('normalizes common separators on decode', () => {
    expect(decodeHex('0x48, 0x69; 0x20\\x21')).toBe('Hi !')
  })

  it('throws for odd-length hex', () => {
    expect(() => decodeHex('486')).toThrow('odd length')
  })

  it('throws for non-hex characters', () => {
    expect(() => decodeHex('48656g')).toThrow('Invalid hex character')
  })
})

describe('base32', () => {
  it('matches RFC 4648 test vectors', () => {
    expect(encodeBase32('f')).toBe('MY======')
    expect(encodeBase32('fo')).toBe('MZXQ====')
    expect(encodeBase32('foo')).toBe('MZXW6===')
    expect(encodeBase32('foob')).toBe('MZXW6YQ=')
    expect(encodeBase32('fooba')).toBe('MZXW6YTB')
    expect(encodeBase32('foobar')).toBe('MZXW6YTBOI======')
  })

  it('round-trips text', () => {
    const text = 'Hello, World! 你好'
    expect(decodeBase32(encodeBase32(text))).toBe(text)
  })

  it('round-trips empty string', () => {
    expect(encodeBase32('')).toBe('')
    expect(decodeBase32('')).toBe('')
  })

  it('throws for invalid characters', () => {
    expect(() => decodeBase32('MY1=====')).toThrow('Invalid base32 character')
  })

  it('throws on misplaced padding', () => {
    expect(() => decodeBase32('MY==XXXX')).toThrow('Invalid base32 padding')
  })
})

describe('base58', () => {
  it('matches known vector', () => {
    expect(encodeBase58('Hello')).toBe('9Ajdvzr')
    expect(decodeBase58('9Ajdvzr')).toBe('Hello')
  })

  it('round-trips unicode text', () => {
    const text = 'hello world 123'
    expect(decodeBase58(encodeBase58(text))).toBe(text)
  })

  it('round-trips empty string', () => {
    expect(encodeBase58('')).toBe('')
    expect(decodeBase58('')).toBe('')
  })

  it('throws for invalid characters', () => {
    expect(() => decodeBase58('0OIl')).toThrow('Invalid base58 character')
  })
})

describe('convertRadix', () => {
  it('converts binary to decimal', () => {
    expect(convertRadix('1010', 2, 10)).toBe('10')
  })

  it('converts decimal to binary', () => {
    expect(convertRadix('255', 10, 2)).toBe('11111111')
  })

  it('converts decimal to octal', () => {
    expect(convertRadix('64', 10, 8)).toBe('100')
  })

  it('converts decimal to hex', () => {
    expect(convertRadix('255', 10, 16)).toBe('FF')
  })

  it('converts hex to decimal', () => {
    expect(convertRadix('FF', 16, 10)).toBe('255')
  })

  it('converts with a custom alphabet', () => {
    const alphabet = '0123456789abcdef'
    expect(convertRadix('1111', 2, 16, alphabet)).toBe('f')
  })

  it('returns zero as the first alphabet character', () => {
    expect(convertRadix('0', 10, 2)).toBe('0')
  })

  it('returns empty string for empty input', () => {
    expect(convertRadix('', 10, 2)).toBe('')
  })

  it('throws for invalid characters in source base', () => {
    expect(() => convertRadix('FF', 10, 16)).toThrow(
      'Invalid character "F" for base 10',
    )
  })

  it('throws for bases out of range', () => {
    expect(() => convertRadix('10', 1, 2)).toThrow('Invalid fromBase: 1')
    expect(() => convertRadix('10', 2, 65)).toThrow('Invalid toBase: 65')
  })

  it('throws for duplicate characters in custom alphabet', () => {
    expect(() => convertRadix('1', 2, 2, '0011223344')).toThrow(
      'duplicate characters',
    )
  })
})
