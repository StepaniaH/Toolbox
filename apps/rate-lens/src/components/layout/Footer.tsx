import { useTranslation } from '@toolbox/i18n/react'
import { ToolboxFooter } from '@toolbox/nav/ToolboxFooter.tsx'

export function Footer() {
  const { t } = useTranslation()
  return (
    <div className="mt-12">
      <p className="mb-4 text-center text-xs text-faint">
        {t('footer.disclaimer')}
      </p>
      <ToolboxFooter appId="rate-lens" />
    </div>
  )
}
