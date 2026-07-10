import { useTranslation } from '@toolbox/i18n/react'
import { Input } from '@/components/ui/input'

interface FundingInputsProps {
  recharge: string
  arrived: string
  onRecharge: (v: string) => void
  onArrived: (v: string) => void
}

export function FundingInputs({
  recharge,
  arrived,
  onRecharge,
  onArrived,
}: FundingInputsProps) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">
          {t('funding.recharge')} <span className="text-faint">{t('funding.cnyUnit')}</span>
        </span>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder={t('funding.placeholder')}
          value={recharge}
          onChange={(e) => onRecharge(e.target.value)}
          className="tabular"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">
          {t('funding.arrived')} <span className="text-faint">{t('funding.usdUnit')}</span>
        </span>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder={t('funding.placeholder')}
          value={arrived}
          onChange={(e) => onArrived(e.target.value)}
          className="tabular"
        />
      </label>
    </div>
  )
}
