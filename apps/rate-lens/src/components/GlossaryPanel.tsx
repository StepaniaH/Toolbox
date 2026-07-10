import { useState } from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'
import { useTranslation } from '@toolbox/i18n/react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

const TERM_KEYS = [
  'rechargeAmount',
  'arrivedAmount',
  'groupRate',
  'rechargeRatio',
  'officialCostRatio',
  'inputOutput',
  'cacheWriteRead',
  'tokens',
] as const

export function GlossaryPanel() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-line bg-card/40">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium text-fg transition-colors hover:bg-surface/40"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="size-4 text-blue" />
            {t('glossary.title')}
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-faint transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
          {TERM_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-md bg-surface/30 px-3 py-2"
            >
              <div className="text-sm font-medium text-fg">{t(`glossary.terms.${key}.term`)}</div>
              <div className="mt-0.5 text-xs text-faint">{t(`glossary.terms.${key}.desc`)}</div>
            </div>
          ))}
        </div>
        <div className="mx-4 mb-4 rounded-md border border-blue/20 bg-blue/5 px-3 py-2 text-xs text-muted-foreground">
          {t('glossary.explanation')}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
