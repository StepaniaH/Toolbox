import { describe, it, expect } from 'vitest'
import {
  cn,
  parseNum,
  formatNumber,
  formatPercent,
  formatDiscount,
  formatCNY,
  formatUSD,
  classifyVerdict,
  safeDiv,
} from '@/lib/utils'

describe('cn', () => {
  it('merges tailwind classes and dedupes conflicting ones', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    const flag = false
    expect(cn('a', flag && 'b', undefined, 'c')).toBe('a c')
  })
})

describe('parseNum', () => {
  it('returns null for empty / null / undefined / non-numeric', () => {
    expect(parseNum('')).toBeNull()
    expect(parseNum(null)).toBeNull()
    expect(parseNum(undefined)).toBeNull()
    expect(parseNum('abc')).toBeNull()
    expect(parseNum(NaN)).toBeNull()
    expect(parseNum(Infinity)).toBeNull()
  })

  it('parses numbers and numeric strings', () => {
    expect(parseNum(0)).toBe(0)
    expect(parseNum('3.5')).toBe(3.5)
    expect(parseNum(' 7 ')).toBe(7)
  })
})

describe('formatNumber', () => {
  it('trims trailing zeros', () => {
    expect(formatNumber(1.5, 2)).toBe('1.5')
    expect(formatNumber(2.0, 2)).toBe('2')
    expect(formatNumber(2.5, 4)).toBe('2.5')
  })

  it('returns — for non-finite', () => {
    expect(formatNumber(NaN)).toBe('—')
    expect(formatNumber(Infinity)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('formats a 0-1 ratio as percentage', () => {
    expect(formatPercent(0.153)).toBe('15.3%')
    expect(formatPercent(1)).toBe('100%')
  })
})

describe('classifyVerdict', () => {
  it('classifies with ±20% default band', () => {
    expect(classifyVerdict(-0.3)).toBe('cheaper')
    expect(classifyVerdict(0.3)).toBe('expensive')
    expect(classifyVerdict(0.1)).toBe('flat')
    expect(classifyVerdict(null)).toBe('na')
  })

  it('uses tight band when provided', () => {
    expect(classifyVerdict(-0.01, 0.005)).toBe('cheaper')
    expect(classifyVerdict(0.001, 0.005)).toBe('flat')
  })
})

describe('formatDiscount', () => {
  it('returns 便宜/贵/持平 text and sign', () => {
    expect(formatDiscount(-0.861).text).toBe('比官方便宜 86.1%')
    expect(formatDiscount(-0.861).sign).toBe('cheaper')
    expect(formatDiscount(0.25).text).toBe('比官方贵 25%')
    expect(formatDiscount(0.25).sign).toBe('expensive')
    expect(formatDiscount(0.001).text).toBe('与官方持平')
    expect(formatDiscount(0.001).sign).toBe('flat')
  })
})

describe('currency formatters', () => {
  it('formats ¥ and $', () => {
    expect(formatCNY(25)).toBe('¥25')
    expect(formatUSD(6.25)).toBe('$6.25')
    expect(formatCNY(NaN)).toBe('—')
  })
})

describe('safeDiv', () => {
  it('returns null on missing or zero divisor', () => {
    expect(safeDiv(10, 0)).toBeNull()
    expect(safeDiv(null, 2)).toBeNull()
    expect(safeDiv(10, 2)).toBe(5)
  })
})
