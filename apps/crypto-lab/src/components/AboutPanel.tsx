import { useTranslation } from '@toolbox/i18n/react'

export function AboutPanel() {
  const { t } = useTranslation()
  const sections = ['purpose', 'privacy', 'security', 'limits'] as const

  return (
    <div className="cl-about">
      <header className="cl-module-intro">
        <p className="cl-eyebrow">CryptoLab</p>
        <h2>{t('about.title')}</h2>
        <p>{t('about.intro')}</p>
      </header>
      <dl className="cl-about-list">
        {sections.map((section) => (
          <div key={section}>
            <dt>{t(`about.${section}.title`)}</dt>
            <dd>{t(`about.${section}.body`)}</dd>
          </div>
        ))}
      </dl>
      <p className="cl-security-note">{t('about.disclaimer')}</p>
    </div>
  )
}
