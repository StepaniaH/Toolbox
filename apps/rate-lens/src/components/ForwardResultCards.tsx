import { useTranslation } from '@toolbox/i18n/react'
import { cn, formatNumber, formatPercent } from '@/lib/utils'
import type { ForwardResult } from '@/types'

interface ForwardResultCardsProps {
  result: ForwardResult
}

interface CardDef {
  key: string
  value: string
  accent: string
  valueClass: string
}

export function ForwardResultCards({ result }: ForwardResultCardsProps) {
  const { t } = useTranslation()
  const { rechargeRatio, equivalentRate, officialCostRatio, ready } = result

  const cards: CardDef[] = [
    {
      key: 'rechargeRatio',
      value: ready && rechargeRatio !== null ? `${formatNumber(rechargeRatio, 4)} ¥/$` : '—',
      accent: 'text-teal',
      valueClass: 'tabular',
    },
    {
      key: 'equivalentRate',
      value: ready && equivalentRate !== null ? formatNumber(equivalentRate, 4) : '—',
      accent: 'text-blue',
      valueClass: 'tabular',
    },
    {
      key: 'officialCost',
      value: ready && officialCostRatio !== null ? formatPercent(officialCostRatio, 1) : '—',
      accent: 'text-peach',
      valueClass: 'tabular',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.key}
          className={cn(
            'card-glow rounded-lg border border-line bg-card/50 px-4 py-3',
            'transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-card',
          )}
        >
          <div className="text-xs text-faint">{t(`forwardResult.${c.key}`)}</div>
          <div className={cn('mt-1 text-2xl font-semibold', c.accent, c.valueClass)}>
            {c.value}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{t(`forwardResult.${c.key}Hint`)}</div>
        </div>
      ))}
    </div>
  )
}
