import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nProvider } from '@toolbox/i18n/react'
import './index.css'
import App from './App.tsx'
import { PreferencesProvider } from './context/PreferencesContext.tsx'
import { zhTranslations, enTranslations } from './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider translations={{ zh: zhTranslations, en: enTranslations }}>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </I18nProvider>
  </StrictMode>,
)
