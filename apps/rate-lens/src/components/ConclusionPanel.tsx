import { useTranslation } from '@toolbox/i18n/react'
import { cn, classifyVerdict, formatNumber, formatPercent } from '@/lib/utils'
import type { ForwardResult } from '@/types'

interface ConclusionPanelProps {
  result: ForwardResult
}

export function ConclusionPanel({ result }: ConclusionPanelProps) {
  const { t } = useTranslation()
  const { equivalentRate, officialCostRatio, ready } = result

  if (!ready || officialCostRatio === null || equivalentRate === null) {
    return (
      <div className="animate-fade rounded-lg border border-dashed border-line px-4 py-4 text-center text-sm text-faint">
        {t('conclusion.empty')}
      </div>
    )
  }

  // 占官方成本 < 1 → 比官方便宜; > 1 → 贵
  const verdict = classifyVerdict(officialCostRatio - 1, 0.005)
  const pct = formatNumber(Math.abs(officialCostRatio - 1) * 100, 1)
  const verdictText = t(`verdict.${verdict}`, { pct })

  const verdictColor =
    verdict === 'cheaper'
      ? 'text-green'
      : verdict === 'expensive'
        ? 'text-red'
        : 'text-yellow'

  const verdictBorder =
    verdict === 'cheaper'
      ? 'border-green/40'
      : verdict === 'expensive'
        ? 'border-red/40'
        : 'border-yellow/40'

  const verdictBg =
    verdict === 'cheaper'
      ? 'from-green/10'
      : verdict === 'expensive'
        ? 'from-red/10'
        : 'from-yellow/10'

  return (
    <div
      className={cn(
        'card-glow animate-fade relative overflow-hidden rounded-lg border bg-gradient-to-r to-transparent px-5 py-4',
        verdictBorder,
        verdictBg,
      )}
    >
      <div className="text-xs text-faint">{t('conclusion.title')}</div>
      <p className="mt-1 text-sm text-fg sm:text-base">
        {t('conclusion.currentEquiv')}{' '}
        <span className="tabular font-semibold text-blue">
          {formatNumber(equivalentRate, 4)}
        </span>
        {t('conclusion.officialCost')}{' '}
        <span className="tabular font-semibold text-peach">
          {formatPercent(officialCostRatio, 1)}
        </span>
        {t('conclusion.comma')}<span className={cn('font-semibold', verdictColor)}>{verdictText}</span>{t('conclusion.period')}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('conclusion.tableHint')}
      </p>
    </div>
  )
}
