import { describe, it, expect } from 'vitest'
import { calcReverse, calcReverseRow } from '@/calc/reverse'
import { findModelPricing } from '@/data/models'

describe('calcReverseRow', () => {
  const opus = findModelPricing('claude-opus-4.8')!
  const gpt55 = findModelPricing('gpt-5.5')!
  const ctx = { rechargeRatio: 1.0, rate: 7.2 }

  it('Gate5 Case 1: Opus 4.8 output ¥25 → 倍率 1.0, 便宜 86.1%', () => {
    const row = calcReverseRow(opus, 'output', 25, ctx)
    expect(row.groupRate).toBeCloseTo(1.0, 10)
    expect(row.equivalentRate).toBeCloseTo(1.0, 10)
    expect(row.officialCostRatio).toBeCloseTo(25 / 180, 5)
    expect(row.verdict).toBe('cheaper')
    expect(row.discountText).toBe('比官方便宜 86.1%')
  })

  it('Gate5 Case 2: GPT-5.5 cacheWrite ¥10 → 不适用', () => {
    const row = calcReverseRow(gpt55, 'cacheWrite', 10, ctx)
    expect(row.officialUSD).toBeNull()
    expect(row.verdict).toBe('na')
    expect(row.discountText).toBe('不适用')
  })

  it('paid ¥0 → groupRate 0, cheaper', () => {
    const row = calcReverseRow(opus, 'output', 0, ctx)
    expect(row.groupRate).toBe(0)
    expect(row.officialCostRatio).toBe(0)
    expect(row.verdict).toBe('cheaper')
  })

  it('very high paid → expensive verdict', () => {
    const row = calcReverseRow(opus, 'output', 1000, ctx)
    // 1000 / (25*7.2) = 5.56 → expensive
    expect(row.verdict).toBe('expensive')
    expect(row.discountText).toContain('贵')
  })

  it('missing paid → empty row', () => {
    const row = calcReverseRow(opus, 'output', null, ctx)
    expect(row.groupRate).toBeNull()
    expect(row.discountText).toBe('—')
  })
})

describe('calcReverse', () => {
  const opus = findModelPricing('claude-opus-4.8')!
  const ctx = { rechargeRatio: 1.0, rate: 7.2 }

  it('null model → empty summary', () => {
    const s = calcReverse(null, { input: 10, output: 20, cacheWrite: null, cacheRead: null }, ctx)
    expect(s.rows).toHaveLength(0)
    expect(s.avgGroupRate).toBeNull()
    expect(s.best).toBeNull()
    expect(s.worst).toBeNull()
  })

  it('missing rechargeRatio → empty summary', () => {
    const s = calcReverse(opus, { input: 10, output: 20, cacheWrite: null, cacheRead: null }, { rechargeRatio: null, rate: 7.2 })
    expect(s.rows).toHaveLength(0)
  })

  it('multi-dimension → rows + avg + best/worst', () => {
    // input: paid ¥5, official$5 → groupRate 1.0, costRatio 5/36 = 0.139
    // output: paid ¥50, official$25 → groupRate 2.0, costRatio 50/180 = 0.278
    const s = calcReverse(opus, { input: 5, output: 50, cacheWrite: null, cacheRead: null }, ctx)
    expect(s.rows).toHaveLength(2)
    expect(s.avgGroupRate).toBeCloseTo(1.5, 10)
    // best = lowest costRatio = input (0.139); worst = output (0.278)
    expect(s.best?.kind).toBe('input')
    expect(s.worst?.kind).toBe('output')
  })

  it('GPT cacheWrite filled → 保留"不适用"行，不计入汇总', () => {
    const gpt55 = findModelPricing('gpt-5.5')!
    // 输入实付 ¥5 (valid) + 缓存写入 ¥10 (GPT 无此项 → na)
    const s = calcReverse(gpt55, { input: 5, output: null, cacheWrite: 10, cacheRead: null }, ctx)
    expect(s.rows).toHaveLength(2)
    const cacheRow = s.rows.find((r) => r.kind === 'cacheWrite')
    expect(cacheRow?.officialUSD).toBeNull()
    expect(cacheRow?.verdict).toBe('na')
    expect(cacheRow?.discountText).toBe('不适用')
    // avg 只算 valid 行 (input)
    expect(s.avgGroupRate).not.toBeNull()
    expect(s.best?.kind).toBe('input')
  })
})
