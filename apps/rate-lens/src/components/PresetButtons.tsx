import { useTranslation } from '@toolbox/i18n/react'
import { cn } from '@/lib/utils'
import type { CalcMode } from '@/types'

export interface Preset {
  labelKey: string
  recharge?: number
  arrived?: number
  groupRate?: number
}

interface PresetButtonsProps {
  mode: CalcMode
  onPreset: (p: Preset) => void
}

const FUNDING_PRESETS: Preset[] = [
  { labelKey: 'preset.recharge100arrived100', recharge: 100, arrived: 100 },
  { labelKey: 'preset.recharge100arrived50', recharge: 100, arrived: 50 },
]

const RATE_PRESETS: Preset[] = [
  { labelKey: 'preset.rate0.6', groupRate: 0.6 },
  { labelKey: 'preset.rate1.1', groupRate: 1.1 },
]

export function PresetButtons({ mode, onPreset }: PresetButtonsProps) {
  const { t } = useTranslation()
  const presets = mode === 'forward' ? [...FUNDING_PRESETS, ...RATE_PRESETS] : FUNDING_PRESETS
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button
          key={p.labelKey}
          type="button"
          onClick={() => onPreset(p)}
          className={cn(
            'rounded-pill border border-line bg-surface/40 px-3 py-1 text-xs font-medium text-muted-foreground',
            'transition-all hover:border-blue/40 hover:bg-blue/10 hover:text-blue',
          )}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  )
}
