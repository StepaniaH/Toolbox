import type {
  ForwardInput,
  ForwardResult,
  ModelPricing,
  PriceCell,
  PriceKind,
  Verdict,
} from '@/types'
import { classifyVerdict, safeDiv } from '@/lib/utils'

/**
 * 倍率正算核心.
 * 1. 充值比例 = 充值金额(¥) ÷ 到账金额($)
 * 2. 1:1 等效分组倍率 = 分组倍率 × 充值比例
 * 3. 占官方成本 = 等效分组倍率 ÷ 实时汇率
 */
export function calcForward(input: ForwardInput): ForwardResult {
  const rechargeRatio = safeDiv(input.recharge, input.arrived)
  const equivalentRate =
    rechargeRatio === null || input.groupRate === null
      ? null
      : rechargeRatio * input.groupRate
  const officialCostRatio = safeDiv(equivalentRate, input.exchangeRate)

  const ready =
    rechargeRatio !== null &&
    equivalentRate !== null &&
    officialCostRatio !== null

  return { rechargeRatio, equivalentRate, officialCostRatio, ready }
}

/** 官方 $ → 官方 ¥ (按汇率). */
export function officialCNY(usd: number, rate: number): number {
  return usd * rate
}

/** 模型实付 ¥ = 官方 $ × 分组倍率 × 充值比例. */
export function paidCNY(
  usd: number,
  groupRate: number,
  rechargeRatio: number,
): number {
  return usd * groupRate * rechargeRatio
}

/**
 * 计算价格表单元格 — 实付 ¥ pill + 官方 ¥ 划线 + verdict.
 * 当 groupRate/rechargeRatio/rate 任一缺失时返回 null verdict 的占位单元.
 */
export function calcPriceCell(
  model: ModelPricing,
  kind: PriceKind,
  ctx: { groupRate: number | null; rechargeRatio: number | null; rate: number | null },
): PriceCell {
  const officialUSD = fieldOf(model, kind)
  const base: PriceCell = {
    kind,
    officialUSD,
    paidCNY: null,
    officialCNY: null,
    verdict: 'na',
    ratio: null,
  }

  if (
    officialUSD === null ||
    ctx.groupRate === null ||
    ctx.rechargeRatio === null ||
    ctx.rate === null
  ) {
    return base
  }

  const paid = paidCNY(officialUSD, ctx.groupRate, ctx.rechargeRatio)
  const official = officialCNY(officialUSD, ctx.rate)
  const ratio = safeDiv(paid, official)
  const verdict: Verdict = classifyVerdict(
    ratio === null ? null : ratio - 1,
    0.2,
  )

  return { kind, officialUSD, paidCNY: paid, officialCNY: official, verdict, ratio }
}

/** 读取模型的某个价格维度 (cacheWrite 可能为 null). */
export function fieldOf(model: ModelPricing, kind: PriceKind): number | null {
  switch (kind) {
    case 'input':
      return model.input
    case 'cacheWrite':
      return model.cacheWrite
    case 'cacheRead':
      return model.cacheRead
    case 'output':
      return model.output
  }
}
