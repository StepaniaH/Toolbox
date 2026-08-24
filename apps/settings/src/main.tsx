import React from 'react'
import { createRoot } from 'react-dom/client'
import '@toolbox/theme/styles.css'
import '@toolbox/theme/toggle.js'
import { I18nProvider } from '@toolbox/i18n/react'
import { translations } from './translations'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider translations={translations}>
      <App />
    </I18nProvider>
  </React.StrictMode>,
)
