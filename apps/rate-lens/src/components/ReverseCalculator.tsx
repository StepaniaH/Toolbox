import { useMemo } from 'react'
import { ChevronDown, Layers } from 'lucide-react'
import { useTranslation } from '@toolbox/i18n/react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReverseResultCards } from '@/components/ReverseResultCards'
import { calcReverse } from '@/calc/reverse'
import { findModelPricing, CLAUDE_MODELS, GPT_MODELS } from '@/data/models'
import { cn, parseNum, safeDiv } from '@/lib/utils'
import type { PriceKind, ReversePaidInput } from '@/types'

interface ReverseCalculatorProps {
  recharge: string
  arrived: string
  rate: number | null
  reverseModelId: string | null
  onReverseModelId: (id: string) => void
  reversePaid: ReversePaidInput
  onPaidField: (kind: PriceKind, value: string) => void
  cacheExpanded: boolean
  onCacheExpanded: (v: boolean) => void
}

const PAID_FIELDS: { kind: PriceKind; labelKey: string; placeholderKey: string }[] = [
  { kind: 'input', labelKey: 'reverse.paidInput', placeholderKey: 'reverse.phInput' },
  { kind: 'output', labelKey: 'reverse.paidOutput', placeholderKey: 'reverse.phOutput' },
]

const CACHE_FIELDS: { kind: PriceKind; labelKey: string; placeholderKey: string }[] = [
  { kind: 'cacheWrite', labelKey: 'reverse.cacheWrite', placeholderKey: 'reverse.phCacheWrite' },
  { kind: 'cacheRead', labelKey: 'reverse.cacheRead', placeholderKey: 'reverse.phCacheRead' },
]

export function ReverseCalculator({
  recharge,
  arrived,
  rate,
  reverseModelId,
  onReverseModelId,
  reversePaid,
  onPaidField,
  cacheExpanded,
  onCacheExpanded,
}: ReverseCalculatorProps) {
  const { t } = useTranslation()
  const rechargeRatio = safeDiv(parseNum(recharge), parseNum(arrived))

  const model = findModelPricing(reverseModelId)

  const summary = useMemo(
    () =>
      calcReverse(model, reversePaid, {
        rechargeRatio,
        rate,
      }),
    [model, reversePaid, rechargeRatio, rate],
  )

  const valueFor = (k: PriceKind): string => {
    const v = reversePaid[k]
    return v === null ? '' : String(v)
  }

  return (
    <div className="animate-fade flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">{t('reverse.referenceModel')}</span>
        <Select
          value={reverseModelId ?? ''}
          onValueChange={onReverseModelId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('reverse.selectModel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Claude</SelectLabel>
              {CLAUDE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>GPT & Codex</SelectLabel>
              {GPT_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {PAID_FIELDS.map((f) => (
          <label key={f.kind} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">
              {t(f.labelKey)} <span className="text-faint">{t('reverse.cnyPerM')}</span>
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder={t(f.placeholderKey)}
              value={valueFor(f.kind)}
              onChange={(e) => onPaidField(f.kind, e.target.value)}
              className="tabular"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onCacheExpanded(!cacheExpanded)}
        className="flex items-center gap-1.5 self-start text-xs text-muted-foreground transition-colors hover:text-fg"
      >
        <Layers className="size-3.5" />
        {t('reverse.cacheToggle')}
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform',
            cacheExpanded && 'rotate-180',
          )}
        />
      </button>

      {cacheExpanded && (
        <div className="grid gap-3 rounded-lg border border-line bg-mantle/30 p-3 sm:grid-cols-2">
          {CACHE_FIELDS.map((f) => (
            <label key={f.kind} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {t(f.labelKey)} <span className="text-faint">{t('reverse.cnyPerM')}</span>
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder={t(f.placeholderKey)}
                value={valueFor(f.kind)}
                onChange={(e) => onPaidField(f.kind, e.target.value)}
                className="tabular"
              />
            </label>
          ))}
        </div>
      )}

      <ReverseResultCards summary={summary} model={model} />
    </div>
  )
}
