import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nProvider } from '@toolbox/i18n/react'
import '@toolbox/theme/tokens.css'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import zh from './translations/zh.json'
import zhHant from './translations/zh-Hant.json'
import en from './translations/en.json'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider translations={{ zh, 'zh-Hant': zhHant, en }}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </I18nProvider>
  </StrictMode>,
)
