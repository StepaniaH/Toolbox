import { useTranslation } from '@toolbox/i18n/react'
import { cn } from '@/lib/utils'
import type { CalcMode } from '@/types'

interface ModeSwitcherProps {
  mode: CalcMode
  onChange: (mode: CalcMode) => void
}

const MODES: CalcMode[] = ['forward', 'reverse']

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  const { t } = useTranslation()
  return (
    <div
      role="tablist"
      aria-label={t('mode.ariaLabel')}
      className="inline-flex rounded-pill bg-surface/50 p-1"
    >
      {MODES.map((m) => {
        const active = mode === m
        return (
          <button
            key={m}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(m)}
            className={cn(
              'rounded-pill px-4 py-1.5 text-sm font-medium transition-all',
              active
                ? 'bg-blue text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-fg',
            )}
          >
            {t(`mode.${m}`)}
          </button>
        )
      })}
    </div>
  )
}
