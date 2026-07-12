import { connectPlatform } from './js/platform.js'
import '@toolbox/nav/nav-bar.js'
import { mountAppIcon } from '@toolbox/nav/app-icon.js'
import { autoMountToolboxFooters } from '@toolbox/nav/toolbox-footer.js'
import './js/theme.js'
import './js/i18n.js'
import './js/i18n-zh.js'
import './js/i18n-en.js'
import './js/constants.js'
import './js/calc.js'
import './js/state.js'
import './js/data-scenarios.js'
import './js/data-panels.js'
import './js/tab-sharpness.js'
import './js/tab-size-view.js'
import './js/tab-color-lab.js'
import './js/tab-scenarios.js'
import './js/tab-panel-guide.js'
import './script.js'

window.ThemeManager.init()
window.I18n.init()
connectPlatform()
mountAppIcon('.app-header .logo', 'monitor-choice')
autoMountToolboxFooters()
window.MonitorChoice.init()
delete window.__MONITOR_CHOICE_MANUAL_BOOT__
