import { useTranslation } from '@toolbox/i18n/react'
import { cn, formatCNY, formatNumber, formatPercent, formatUSD } from '@/lib/utils'
import type { ModelPricing, ReverseRowResult, ReverseSummary, Verdict } from '@/types'

interface ReverseResultCardsProps {
  summary: ReverseSummary
  model: ModelPricing | null
}

const VERDICT_BADGE: Record<Verdict, string> = {
  cheaper: 'bg-green/15 text-green ring-green/30',
  flat: 'bg-yellow/15 text-yellow ring-yellow/30',
  expensive: 'bg-red/15 text-red ring-red/30',
  na: 'bg-surface/40 text-faint ring-line',
}

function RowCard({ row, ratio }: { row: ReverseRowResult; ratio: number | null }) {
  const { t } = useTranslation()
  const verdictText =
    row.verdict === 'na'
      ? t('verdict.na')
      : row.officialCostRatio === null
        ? '—'
        : t(`verdict.${row.verdict}`, {
            pct: formatNumber(Math.abs(row.officialCostRatio - 1) * 100, 1),
          })

  return (
    <div className="card-glow rounded-lg border border-line bg-card/40 px-4 py-3 transition-all duration-200 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-fg">
          {t(`reverseResult.kind.${row.kind}`)}{t('reverseResult.paid')}
        </span>
        <span
          className={cn(
            'rounded-pill px-2 py-0.5 text-xs font-medium ring-1',
            VERDICT_BADGE[row.verdict],
          )}
        >
          {verdictText}
        </span>
      </div>

      {row.officialUSD === null ? (
        <div className="mt-2 text-xs text-faint">{t('reverseResult.notApplicable')}</div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-faint">{t('reverseResult.realGroupRate')}</div>
              <div className="tabular text-lg font-semibold text-blue">
                {row.groupRate !== null ? formatNumber(row.groupRate, 4) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-faint">{t('reverseResult.equivalentRate')}</div>
              <div className="tabular text-lg font-semibold text-mauve">
                {row.equivalentRate !== null ? formatNumber(row.equivalentRate, 4) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-faint">{t('reverseResult.officialCost')}</div>
              <div className="tabular text-lg font-semibold text-peach">
                {row.officialCostRatio !== null
                  ? formatPercent(row.officialCostRatio, 1)
                  : '—'}
              </div>
            </div>
          </div>
          <div className="mt-2 tabular text-[10px] text-overlay">
            {formatCNY(row.paidCNY ?? NaN)} ÷ {formatUSD(row.officialUSD)}
            {ratio !== null ? ` ÷ ${formatNumber(ratio, 4)}` : ''} = {t('reverseResult.rateWord')}
          </div>
        </>
      )}
    </div>
  )
}

export function ReverseResultCards({ summary, model }: ReverseResultCardsProps) {
  const { t } = useTranslation()
  const { rows, avgGroupRate, best, worst } = summary

  if (!model) {
    return (
      <div className="rounded-lg border border-dashed border-line px-4 py-4 text-center text-sm text-faint">
        {t('reverseResult.selectModelHint')}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line px-4 py-4 text-center text-sm text-faint">
        {t('reverseResult.fillPaidHint')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <RowCard key={r.kind} row={r} ratio={model ? null : null} />
        ))}
      </div>

      <div className="rounded-lg border border-line bg-surface/20 px-4 py-3">
        <div className="text-xs font-medium text-fg">{t('reverseResult.summary')}</div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-faint">{t('reverseResult.avgRate')}</div>
            <div className="tabular text-base font-semibold text-blue">
              {avgGroupRate !== null ? formatNumber(avgGroupRate, 4) : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-faint">{t('reverseResult.best')}</div>
            <div className="text-xs font-medium text-green">
              {best ? t(`reverseResult.kind.${best.kind}`) : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-faint">{t('reverseResult.worst')}</div>
            <div className="text-xs font-medium text-red">
              {worst ? t(`reverseResult.kind.${worst.kind}`) : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
