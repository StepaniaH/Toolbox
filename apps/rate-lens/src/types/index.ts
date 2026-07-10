export type ModelProvider = 'claude' | 'gpt'

export type PriceKind = 'input' | 'cacheWrite' | 'cacheRead' | 'output'

export interface ModelPricing {
  id: string
  name: string
  provider: ModelProvider
  context: string
  input: number
  cacheWrite: number | null
  cacheRead: number
  output: number
  note?: string
}

export interface ForwardInput {
  recharge: number | null
  arrived: number | null
  groupRate: number | null
  exchangeRate: number | null
}

export interface ForwardResult {
  rechargeRatio: number | null
  equivalentRate: number | null
  officialCostRatio: number | null
  ready: boolean
}

export interface PriceCell {
  kind: PriceKind
  officialUSD: number | null
  paidCNY: number | null
  officialCNY: number | null
  verdict: Verdict
  ratio: number | null
}

export type Verdict = 'cheaper' | 'flat' | 'expensive' | 'na'

export interface ReversePaidInput {
  input: number | null
  output: number | null
  cacheWrite: number | null
  cacheRead: number | null
}

export interface ReverseRowResult {
  kind: PriceKind
  paidCNY: number | null
  officialUSD: number | null
  groupRate: number | null
  equivalentRate: number | null
  officialCostRatio: number | null
  verdict: Verdict
  discountText: string
}

export interface ReverseSummary {
  rows: ReverseRowResult[]
  avgGroupRate: number | null
  best: ReverseRowResult | null
  worst: ReverseRowResult | null
}

export type CalcMode = 'forward' | 'reverse'

export interface AppState {
  mode: CalcMode
  recharge: string
  arrived: string
  groupRate: string
  exchangeRate: string
  provider: ModelProvider
  reverseModelId: string | null
  reversePaid: ReversePaidInput
  cacheExpanded: boolean
}
