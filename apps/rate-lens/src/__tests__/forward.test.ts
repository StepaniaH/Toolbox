import { describe, it, expect } from 'vitest'
import { calcForward, calcPriceCell, fieldOf } from '@/calc/forward'
import { findModelPricing } from '@/data/models'

describe('calcForward', () => {
  it('Case 1: 100/100/1.1 → ratio 1.0, equiv 1.1, 占官方 ~15.3%', () => {
    const r = calcForward({ recharge: 100, arrived: 100, groupRate: 1.1, exchangeRate: 7.2 })
    expect(r.rechargeRatio).toBe(1)
    expect(r.equivalentRate).toBeCloseTo(1.1, 10)
    expect(r.officialCostRatio).toBeCloseTo(1.1 / 7.2, 5)
    expect(r.ready).toBe(true)
  })

  it('Case 2: 100/50/0.6 → ratio 2.0, equiv 1.2, 占官方 ~16.7%', () => {
    const r = calcForward({ recharge: 100, arrived: 50, groupRate: 0.6, exchangeRate: 7.2 })
    expect(r.rechargeRatio).toBe(2)
    expect(r.equivalentRate).toBeCloseTo(1.2, 10)
    expect(r.officialCostRatio).toBeCloseTo(1.2 / 7.2, 5)
    expect(r.ready).toBe(true)
  })

  it('missing recharge → not ready, ratio null', () => {
    const r = calcForward({ recharge: null, arrived: 100, groupRate: 1.1, exchangeRate: 7.2 })
    expect(r.rechargeRatio).toBeNull()
    expect(r.ready).toBe(false)
  })

  it('missing groupRate → ratio computed but equiv/cost null, not ready', () => {
    const r = calcForward({ recharge: 100, arrived: 100, groupRate: null, exchangeRate: 7.2 })
    expect(r.rechargeRatio).toBe(1)
    expect(r.equivalentRate).toBeNull()
    expect(r.officialCostRatio).toBeNull()
    expect(r.ready).toBe(false)
  })

  it('zero arrived → ratio null (safe div), not ready', () => {
    const r = calcForward({ recharge: 100, arrived: 0, groupRate: 1.1, exchangeRate: 7.2 })
    expect(r.rechargeRatio).toBeNull()
    expect(r.ready).toBe(false)
  })
})

describe('calcPriceCell', () => {
  const opus = findModelPricing('claude-opus-4.8')!
  const gpt55 = findModelPricing('gpt-5.5')!

  it('Claude Opus input @ 1.1/1.0/7.2 → cheaper pill', () => {
    const cell = calcPriceCell(opus, 'input', { groupRate: 1.1, rechargeRatio: 1.0, rate: 7.2 })
    expect(cell.officialUSD).toBe(5)
    expect(cell.paidCNY).toBeCloseTo(5 * 1.1 * 1.0, 10)
    expect(cell.officialCNY).toBeCloseTo(5 * 7.2, 10)
    expect(cell.verdict).toBe('cheaper')
  })

  it('GPT cacheWrite → officialUSD null, verdict na, paidCNY null', () => {
    const cell = calcPriceCell(gpt55, 'cacheWrite', { groupRate: 1.1, rechargeRatio: 1.0, rate: 7.2 })
    expect(cell.officialUSD).toBeNull()
    expect(cell.paidCNY).toBeNull()
    expect(cell.verdict).toBe('na')
  })

  it('high groupRate → expensive pill', () => {
    const cell = calcPriceCell(opus, 'input', { groupRate: 10, rechargeRatio: 1.0, rate: 7.2 })
    // paid/official = (5*10*1)/(5*7.2) = 10/7.2 ≈ 1.389 → expensive
    expect(cell.verdict).toBe('expensive')
  })

  it('fieldOf returns the right column', () => {
    expect(fieldOf(opus, 'output')).toBe(25)
    expect(fieldOf(gpt55, 'cacheWrite')).toBeNull()
    expect(fieldOf(opus, 'cacheRead')).toBe(0.5)
  })
})
