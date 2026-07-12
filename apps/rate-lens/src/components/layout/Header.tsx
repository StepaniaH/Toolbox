import { useTranslation } from '@toolbox/i18n/react'
import { AppIcon } from '@toolbox/nav/AppIcon.tsx'

export function Header() {
  const { t } = useTranslation()
  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 items-center justify-center rounded-xl bg-blue/15 text-blue"
          aria-hidden
        >
          <AppIcon appId="rate-lens" className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">
            RateLens
          </h1>
          <p className="text-xs text-faint sm:text-sm">
            {t('header.subtitle')}
          </p>
        </div>
      </div>
    </header>
  )
}
