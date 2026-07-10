import type {
  ModelPricing,
  PriceKind,
  ReversePaidInput,
  ReverseRowResult,
  ReverseSummary,
  Verdict,
} from '@/types'
import { classifyVerdict, formatDiscount, safeDiv } from '@/lib/utils'
import { fieldOf } from './forward'

const ALL_KINDS: PriceKind[] = ['input', 'output', 'cacheWrite', 'cacheRead']

/**
 * 扣费反推 — 单维度.
 * 真实分组倍率 = 实付¥ ÷ 官方$ ÷ 充值比例
 * 1:1 等效倍率 = 实付¥ ÷ 官方$
 * 占官方成本 = 实付¥ ÷ (官方$ × 汇率)
 */
export function calcReverseRow(
  model: ModelPricing,
  kind: PriceKind,
  paidCNY: number | null,
  ctx: { rechargeRatio: number | null; rate: number | null },
): ReverseRowResult {
  const officialUSD = fieldOf(model, kind)
  const empty: ReverseRowResult = {
    kind,
    paidCNY,
    officialUSD,
    groupRate: null,
    equivalentRate: null,
    officialCostRatio: null,
    verdict: 'na',
    discountText: officialUSD === null ? '不适用' : '—',
  }

  if (
    officialUSD === null ||
    paidCNY === null ||
    ctx.rechargeRatio === null ||
    ctx.rate === null
  ) {
    return empty
  }

  const groupRate = safeDiv(safeDiv(paidCNY, officialUSD), ctx.rechargeRatio)
  const equivalentRate = safeDiv(paidCNY, officialUSD)
  const officialCostRatio = safeDiv(paidCNY, officialUSD * ctx.rate)
  const verdict: Verdict = classifyVerdict(
    officialCostRatio === null ? null : officialCostRatio - 1,
    0.005,
  )
  const discountText =
    officialCostRatio === null
      ? '—'
      : formatDiscount(officialCostRatio - 1).text

  return {
    kind,
    paidCNY,
    officialUSD,
    groupRate,
    equivalentRate,
    officialCostRatio,
    verdict,
    discountText,
  }
}

/** 反推全部维度 — 只含已填写实付的行 (或 cacheWrite=null 的占位行不纳入). */
export function calcReverse(
  model: ModelPricing | null,
  paid: ReversePaidInput,
  ctx: { rechargeRatio: number | null; rate: number | null },
): ReverseSummary {
  if (!model || ctx.rechargeRatio === null || ctx.rate === null) {
    return { rows: [], avgGroupRate: null, best: null, worst: null }
  }

  const rows: ReverseRowResult[] = []
  for (const kind of ALL_KINDS) {
    const paidVal = paid[kind]
    if (paidVal === null) continue // 未填写的维度跳过
    const row = calcReverseRow(model, kind, paidVal, ctx)
    // 保留不适用行 (如 GPT 缓存写入) → 显示"不适用"，但不计入汇总
    rows.push(row)
  }

  const validRows = rows.filter((r) => r.groupRate !== null)
  const groupRates = validRows
    .map((r) => r.groupRate)
    .filter((v): v is number => v !== null)
  const avgGroupRate =
    groupRates.length === 0
      ? null
      : groupRates.reduce((a, b) => a + b, 0) / groupRates.length

  const ranked = [...validRows].sort(
    (a, b) => (a.officialCostRatio ?? Infinity) - (b.officialCostRatio ?? Infinity),
  )
  const best = ranked[0] ?? null
  const worst = ranked[ranked.length - 1] ?? null

  return { rows, avgGroupRate, best, worst }
}
