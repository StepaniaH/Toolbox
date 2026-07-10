import { useMemo } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { Input } from '@/components/ui/input'
import { ForwardResultCards } from '@/components/ForwardResultCards'
import { ConclusionPanel } from '@/components/ConclusionPanel'
import { ModelProviderSelector } from '@/components/ModelProviderSelector'
import { PriceTable } from '@/components/PriceTable'
import { calcForward } from '@/calc/forward'
import { parseNum } from '@/lib/utils'
import type { ModelProvider } from '@/types'

interface ForwardCalculatorProps {
  recharge: string
  arrived: string
  groupRate: string
  onGroupRate: (v: string) => void
  rate: number | null
  provider: ModelProvider
  onProvider: (p: ModelProvider) => void
}

export function ForwardCalculator({
  recharge,
  arrived,
  groupRate,
  onGroupRate,
  rate,
  provider,
  onProvider,
}: ForwardCalculatorProps) {
  const { t } = useTranslation()
  const result = useMemo(
    () =>
      calcForward({
        recharge: parseNum(recharge),
        arrived: parseNum(arrived),
        groupRate: parseNum(groupRate),
        exchangeRate: rate,
      }),
    [recharge, arrived, groupRate, rate],
  )

  const rechargeRatio = result.rechargeRatio

  return (
    <div className="animate-fade flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">
          {t('forwardCalc.groupRate')}
        </span>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder={t('forwardCalc.placeholder')}
          value={groupRate}
          onChange={(e) => onGroupRate(e.target.value)}
          className="tabular"
        />
        <span className="text-xs text-faint">{t('forwardCalc.groupRateHint')}</span>
      </label>

      <ForwardResultCards result={result} />
      <ConclusionPanel result={result} />

      <div className="flex justify-center pt-2">
        <ModelProviderSelector provider={provider} onChange={onProvider} />
      </div>

      <PriceTable
        provider={provider}
        groupRate={parseNum(groupRate)}
        rechargeRatio={rechargeRatio}
        rate={rate}
      />
    </div>
  )
}
