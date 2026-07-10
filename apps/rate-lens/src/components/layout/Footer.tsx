import { useTranslation } from '@toolbox/i18n/react'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-12 border-t border-line py-6 text-center text-xs text-faint">
      <p>
        {t('footer.tagline')}{' '}
        <a
          href="https://github.com/StepaniaH/Toolbox"
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors hover:text-fg"
        >
          GitHub
        </a>
      </p>
      <p className="mt-1">
        {t('footer.disclaimer')}
      </p>
    </footer>
  )
}
