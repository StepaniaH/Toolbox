import { describe, it, expect } from 'vitest'
import {
  CLAUDE_MODELS,
  GPT_MODELS,
  ALL_MODELS,
  modelsByProvider,
  findModelPricing,
} from '@/data/models'

describe('data integrity', () => {
  it('has 5 Claude and 6 GPT models', () => {
    expect(CLAUDE_MODELS).toHaveLength(5)
    expect(GPT_MODELS).toHaveLength(6)
    expect(ALL_MODELS).toHaveLength(11)
  })

  it('every model has positive input/output/cacheRead and valid provider', () => {
    for (const m of ALL_MODELS) {
      expect(m.input).toBeGreaterThan(0)
      expect(m.output).toBeGreaterThan(0)
      expect(m.cacheRead).toBeGreaterThan(0)
      expect(['claude', 'gpt']).toContain(m.provider)
      expect(m.id).toBeTruthy()
      expect(m.name).toBeTruthy()
      expect(m.context).toBeTruthy()
    }
  })

  it('ids are unique', () => {
    const ids = ALL_MODELS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('Claude vs GPT differences', () => {
  it('all Claude models have a cacheWrite price (non-null)', () => {
    for (const m of CLAUDE_MODELS) {
      expect(m.cacheWrite).not.toBeNull()
      expect(m.cacheWrite).toBeGreaterThan(0)
    }
  })

  it('all GPT models have null cacheWrite', () => {
    for (const m of GPT_MODELS) {
      expect(m.cacheWrite).toBeNull()
    }
  })

  it('GPT cacheRead equals 10% of input', () => {
    for (const m of GPT_MODELS) {
      expect(m.cacheRead).toBeCloseTo(m.input * 0.1, 5)
    }
  })

  it('Claude Opus 4.8 has the documented pricing', () => {
    const opus = findModelPricing('claude-opus-4.8')
    expect(opus).not.toBeNull()
    expect(opus?.input).toBe(5)
    expect(opus?.cacheWrite).toBe(6.25)
    expect(opus?.cacheRead).toBe(0.5)
    expect(opus?.output).toBe(25)
  })
})

describe('modelsByProvider', () => {
  it('returns the right list per provider', () => {
    expect(modelsByProvider('claude')).toBe(CLAUDE_MODELS)
    expect(modelsByProvider('gpt')).toBe(GPT_MODELS)
  })
})

describe('findModelPricing', () => {
  it('finds by id and returns null for unknown / null', () => {
    expect(findModelPricing('gpt-5.5')?.name).toBe('GPT-5.5')
    expect(findModelPricing('nope')).toBeNull()
    expect(findModelPricing(null)).toBeNull()
  })
})
