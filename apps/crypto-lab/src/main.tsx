import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nProvider } from '@toolbox/i18n/react'
import '@toolbox/theme/styles.css'
import '@toolbox/theme/toggle.js'
import './index.css'
import App from './App.tsx'
import zh from './translations/zh.json'
import en from './translations/en.json'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider translations={{ zh, en }}>
      <App />
    </I18nProvider>
  </StrictMode>,
)
