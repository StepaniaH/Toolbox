import type { ModelPricing, ModelProvider } from '@/types'

/**
 * Anthropic Claude 系列 — 官方 API 定价 (2026-07).
 * 单位: USD / 1M tokens.
 */
export const CLAUDE_MODELS: ModelPricing[] = [
  {
    id: 'claude-opus-4.8',
    name: 'Claude Opus 4.8',
    provider: 'claude',
    context: '1M',
    input: 5,
    cacheWrite: 6.25,
    cacheRead: 0.5,
    output: 25,
  },
  {
    id: 'claude-opus-4.7',
    name: 'Claude Opus 4.7',
    provider: 'claude',
    context: '1M',
    input: 5,
    cacheWrite: 6.25,
    cacheRead: 0.5,
    output: 25,
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'claude',
    context: '1M',
    input: 2,
    cacheWrite: 2.5,
    cacheRead: 0.2,
    output: 10,
    note: '限时价至 2026-08-31，之后 $3 / $15',
  },
  {
    id: 'claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'claude',
    context: '1M',
    input: 3,
    cacheWrite: 3.75,
    cacheRead: 0.3,
    output: 15,
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'claude',
    context: '200K',
    input: 1,
    cacheWrite: 1.25,
    cacheRead: 0.1,
    output: 5,
  },
]

/**
 * OpenAI GPT / Codex 系列 — 官方 API 定价 (2026-07).
 * GPT 系列无缓存写入项 (null); 缓存读取为输入价的 10%.
 * 单位: USD / 1M tokens.
 */
export const GPT_MODELS: ModelPricing[] = [
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    provider: 'gpt',
    context: '~1.05M',
    input: 5,
    cacheWrite: null,
    cacheRead: 0.5,
    output: 30,
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    provider: 'gpt',
    context: '~1.05M',
    input: 2.5,
    cacheWrite: null,
    cacheRead: 0.25,
    output: 15,
  },
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'gpt',
    context: '400K',
    input: 1.75,
    cacheWrite: null,
    cacheRead: 0.175,
    output: 14,
  },
  {
    id: 'gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    provider: 'gpt',
    context: '400K',
    input: 1.75,
    cacheWrite: null,
    cacheRead: 0.175,
    output: 14,
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'gpt',
    context: '400K',
    input: 1.25,
    cacheWrite: null,
    cacheRead: 0.125,
    output: 10,
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 mini',
    provider: 'gpt',
    context: '400K',
    input: 0.75,
    cacheWrite: null,
    cacheRead: 0.075,
    output: 4.5,
  },
]

export const ALL_MODELS: ModelPricing[] = [...CLAUDE_MODELS, ...GPT_MODELS]

export function modelsByProvider(provider: ModelProvider): ModelPricing[] {
  return provider === 'claude' ? CLAUDE_MODELS : GPT_MODELS
}

export function findModelPricing(id: string | null): ModelPricing | null {
  if (!id) return null
  return ALL_MODELS.find((m) => m.id === id) ?? null
}
