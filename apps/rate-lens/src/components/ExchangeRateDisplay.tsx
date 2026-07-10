import { useState } from 'react'
import { Pencil, Check, Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from '@toolbox/i18n/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn, formatNumber } from '@/lib/utils'
import type { ExchangeSource } from '@/hooks/use-exchange-rate'

interface ExchangeRateDisplayProps {
  rate: number | null
  loading: boolean
  error: string | null
  source: ExchangeSource
  onManual: (n: number) => void
  onRefetch: () => void
}

const SOURCE_KEY: Record<ExchangeSource, string> = {
  auto: 'exchange.sourceAuto',
  manual: 'exchange.sourceManual',
  default: 'exchange.sourceDefault',
}

export function ExchangeRateDisplay({
  rate,
  loading,
  error,
  source,
  onManual,
  onRefetch,
}: ExchangeRateDisplayProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const startEdit = () => {
    setDraft(rate !== null ? String(rate) : '')
    setEditing(true)
  }
  const commit = () => {
    const n = Number(draft)
    if (Number.isFinite(n) && n > 0) onManual(n)
    setEditing(false)
  }

  return (
    <div className="rounded-lg border border-line bg-card/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
          <span className="text-sm text-muted-foreground">{t('exchange.rateLabel')}</span>
          {editing ? (
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="h-7 w-24 tabular"
            />
          ) : (
            <span
              className={cn(
                'tabular text-lg font-semibold text-teal',
                loading && 'opacity-50',
              )}
            >
              {loading ? '—' : rate !== null ? formatNumber(rate, 4) : '—'}
            </span>
          )}
          <span className="text-xs text-faint">¥/USD · {t(SOURCE_KEY[source])}</span>
        </div>

        <div className="flex items-center gap-1">
          {editing ? (
            <Button variant="ghost" size="icon-sm" onClick={commit} aria-label={t('exchange.confirm')}>
              <Check className="size-4 text-green" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" onClick={startEdit} aria-label={t('exchange.edit')}>
              <Pencil className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefetch}
            disabled={loading}
            aria-describedby="exchange-network-disclosure"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {loading ? t('exchange.fetching') : t('exchange.fetchLive')}
          </Button>
        </div>
      </div>

      <p id="exchange-network-disclosure" className="mt-2 text-xs leading-relaxed text-faint">
        {t('exchange.networkDisclosure')}
      </p>
      {error ? (
        <p role="status" className="mt-1 text-xs text-yellow">
          {t('exchange.fetchFailed')}
        </p>
      ) : null}
    </div>
  )
}
