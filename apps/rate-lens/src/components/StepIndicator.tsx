import { useTranslation } from '@toolbox/i18n/react'
import { cn } from '@/lib/utils'
import type { CalcMode } from '@/types'

interface StepIndicatorProps {
  mode: CalcMode
}

const STEP_KEYS = ['one', 'two', 'three'] as const

export function StepIndicator({ mode }: StepIndicatorProps) {
  const { t } = useTranslation()
  const steps = STEP_KEYS.map((k) => t(`steps.${mode}.${k}`))
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular',
              'bg-blue/15 text-blue ring-1 ring-blue/30',
            )}
          >
            {i + 1}
          </span>
          <span className="text-muted-foreground">{label}</span>
          {i < steps.length - 1 && (
            <span className="mx-1 text-faint" aria-hidden>
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
