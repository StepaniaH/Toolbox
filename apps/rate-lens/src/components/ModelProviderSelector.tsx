import { useTranslation } from '@toolbox/i18n/react'
import { cn } from '@/lib/utils'
import type { ModelProvider } from '@/types'

interface ModelProviderSelectorProps {
  provider: ModelProvider
  onChange: (p: ModelProvider) => void
}

const OPTIONS: { value: ModelProvider; label: string }[] = [
  { value: 'claude', label: 'Claude' },
  { value: 'gpt', label: 'GPT & Codex' },
]

export function ModelProviderSelector({ provider, onChange }: ModelProviderSelectorProps) {
  const { t } = useTranslation()
  return (
    <div
      role="tablist"
      aria-label={t('provider.ariaLabel')}
      className="inline-flex rounded-pill bg-surface/50 p-1"
    >
      {OPTIONS.map((o) => {
        const active = provider === o.value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-pill px-4 py-1.5 text-sm font-medium transition-all',
              active
                ? 'bg-mauve text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-fg',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
