import '@toolbox/nav/nav-bar.css'
import '@toolbox/theme/toggle.js'
import { getLang, onChange, setLang } from '@toolbox/i18n/core'

// The Vanilla NavBar supports a small global adapter. Keep the implementation
// in the shared ESM core while exposing only the interface the runtime needs.
window.ToolboxI18n = Object.freeze({ getLang, onChange, setLang })

// Nav auto-mounts as soon as its module evaluates. Load it only after the
// adapter exists so it subscribes to core language changes during mount.
void import('@toolbox/nav/nav-bar.js')
