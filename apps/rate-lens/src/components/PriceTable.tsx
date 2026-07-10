import { useTranslation } from '@toolbox/i18n/react'
import { cn, formatCNY, formatNumber, formatUSD } from '@/lib/utils'
import type { ModelPricing, PriceCell, PriceKind, Verdict } from '@/types'
import { calcPriceCell } from '@/calc/forward'
import { modelsByProvider } from '@/data/models'

interface PriceTableProps {
  provider: 'claude' | 'gpt'
  groupRate: number | null
  rechargeRatio: number | null
  rate: number | null
}

const COLUMNS: { kind: PriceKind; labelKey: string }[] = [
  { kind: 'input', labelKey: 'priceTable.colInput' },
  { kind: 'cacheWrite', labelKey: 'priceTable.colCacheWrite' },
  { kind: 'cacheRead', labelKey: 'priceTable.colCacheRead' },
  { kind: 'output', labelKey: 'priceTable.colOutput' },
]

const VERDICT_PILL: Record<Verdict, string> = {
  cheaper: 'bg-green/15 text-green ring-green/30',
  flat: 'bg-yellow/15 text-yellow ring-yellow/30',
  expensive: 'bg-red/15 text-red ring-red/30',
  na: 'bg-surface/40 text-faint ring-line',
}

function PriceCellView({ cell, groupRate, rechargeRatio }: {
  cell: PriceCell
  groupRate: number | null
  rechargeRatio: number | null
}) {
  const { t } = useTranslation()
  // GPT 无缓存写入
  if (cell.officialUSD === null) {
    return <span className="text-xs text-faint">{t('priceTable.billedAsInput')}</span>
  }

  // 输入缺失时只显示官方价
  if (cell.paidCNY === null || cell.officialCNY === null) {
    return (
      <div className="flex flex-col">
        <span className="tabular text-xs text-faint line-through">
          {formatCNY(cell.officialCNY ?? NaN)}
        </span>
        <span className="text-xs text-faint">{t('priceTable.pending')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          'tabular inline-flex w-fit rounded-pill px-2 py-0.5 text-xs font-semibold ring-1',
          VERDICT_PILL[cell.verdict],
        )}
      >
        {formatCNY(cell.paidCNY)}
      </span>
      <span className="tabular text-xs text-faint line-through">
        {t('priceTable.official')} {formatCNY(cell.officialCNY)}
      </span>
      <span className="tabular text-[10px] text-overlay">
        {formatUSD(cell.officialUSD)} × {groupRate !== null ? formatNumber(groupRate, 2) : '?'} ×{' '}
        {rechargeRatio !== null ? formatNumber(rechargeRatio, 2) : '?'}
      </span>
    </div>
  )
}

export function PriceTable({ provider, groupRate, rechargeRatio, rate }: PriceTableProps) {
  const { t } = useTranslation()
  const models = modelsByProvider(provider)
  const ctx = { groupRate, rechargeRatio, rate }
  const hasCtx = groupRate !== null && rechargeRatio !== null && rate !== null

  return (
    <div className="card-glow rounded-lg border border-line bg-card/40">
      <div className="flex items-center justify-between px-4 py-2.5">
        <h3 className="text-sm font-semibold text-fg">{t('priceTable.title')}</h3>
        {!hasCtx && (
          <span className="text-xs text-faint">{t('priceTable.fillHint')}</span>
        )}
      </div>

      <div className="scroll-mask-x overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-line text-xs text-faint">
              <th className="sticky left-0 z-10 bg-card/80 px-3 py-2 text-left font-medium backdrop-blur">
                {t('priceTable.colModel')}
              </th>
              <th className="px-3 py-2 text-left font-medium">{t('priceTable.colContext')}</th>
              {COLUMNS.map((c) => (
                <th key={c.kind} className="px-3 py-2 text-right font-medium">
                  {t(c.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m: ModelPricing) => (
              <tr
                key={m.id}
                className="border-b border-line/60 transition-colors hover:bg-surface/20"
              >
                <td className="sticky left-0 z-10 bg-card/80 px-3 py-2.5 font-medium text-fg backdrop-blur">
                  <div>{m.name}</div>
                  {m.note && (
                    <div className="text-[10px] text-yellow">{m.note}</div>
                  )}
                </td>
                <td className="tabular px-3 py-2.5 text-muted-foreground">
                  {m.context}
                </td>
                {COLUMNS.map((c) => {
                  const cell = calcPriceCell(m, c.kind, ctx)
                  return (
                    <td key={c.kind} className="px-3 py-2.5 text-right">
                      <PriceCellView
                        cell={cell}
                        groupRate={groupRate}
                        rechargeRatio={rechargeRatio}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
