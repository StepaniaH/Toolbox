import '@toolbox/nav/nav-bar.css'
import '@toolbox/theme/toggle.js'
import { getLang, onChange, setLang } from '@toolbox/i18n/core'

// ES modules execute after parsing. Tell the legacy IIFEs to expose their
// init functions without auto-starting so entry.js can preserve their order.
window.__MONITOR_CHOICE_MANUAL_BOOT__ = true

window.ToolboxI18n = Object.freeze({ getLang, onChange, setLang })

export function connectPlatform() {
  window.I18n.setLocale(getLang())
  onChange((lang) => window.I18n.setLocale(lang))

  // The page theme manager also redraws active canvases. Keep the shared
  // NavBar runtime as the public entry while delegating its toggle here.
  window.ToolboxTheme.toggleTheme = window.ThemeManager.toggle
}
