import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nProvider } from '@toolbox/i18n/react'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import zh from './translations/zh.json'
import en from './translations/en.json'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider translations={{ zh, en }}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </I18nProvider>
  </StrictMode>,
)
