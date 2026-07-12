export const APP_STATUSES = Object.freeze(['hidden', 'preview', 'stable'])
export const TOOLBOX_RELEASE = 'v0.2.1'

export function defineApp(input) {
  const app = {
    status: 'hidden',
    ...input,
    navId: input.navId ?? input.id,
    navLabel: Object.freeze({ ...input.navLabel }),
    description: Object.freeze({ ...input.description }),
    icon: Object.freeze({ ...input.icon }),
  }
  return Object.freeze(app)
}

export const TOOLBOX_APPS = Object.freeze([
  defineApp({
    id: 'homepage',
    navId: 'home',
    path: '/',
    name: 'Toolbox',
    navLabel: { zh: '首页', en: 'Home' },
    description: { zh: 'Toolbox 导航中心', en: 'Toolbox navigation hub' },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<path d="M9 17h30v22H9z"/><path d="M17 17v-4a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v4M9 25h30M21 25v4h6v-4"/>',
    },
    status: 'stable',
  }),
  defineApp({
    id: 'rate-lens',
    path: '/rate-lens/',
    name: 'RateLens',
    navLabel: { zh: 'RateLens', en: 'RateLens' },
    description: { zh: 'AI 模型价格倍率计算器', en: 'AI model pricing calculator' },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<rect x="8" y="8" width="32" height="32" rx="6"/><circle cx="24" cy="20" r="7"/><path d="M24 13V8"/><circle cx="22" cy="19" r="1.5" class="app-icon-fill"/>',
    },
    status: 'stable',
  }),
  defineApp({
    id: 'chrono-sphere',
    path: '/chrono-sphere/',
    name: 'ChronoSphere',
    navLabel: { zh: 'ChronoSphere', en: 'ChronoSphere' },
    description: { zh: '日期与时区工具', en: 'Date & timezone utility' },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<circle cx="24" cy="24" r="19"/><circle cx="24" cy="24" r="2" class="app-icon-fill"/><path d="M24 24V11M24 24l7-6"/><circle cx="24" cy="24" r="14" opacity=".25"/>',
    },
    status: 'stable',
  }),
  defineApp({
    id: 'monitor-choice',
    path: '/monitor-choice/',
    name: 'Monitor Choice',
    navLabel: { zh: 'Monitor Choice', en: 'Monitor Choice' },
    description: { zh: '显示器参数实验室', en: 'Display parameter lab' },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<rect x="8" y="8" width="32" height="22" rx="3"/><path d="M20 34h8M24 30v6"/><rect x="16" y="12" width="16" height="12" rx="1" opacity=".4"/>',
    },
    status: 'stable',
  }),
  defineApp({
    id: 'sane-units',
    path: '/sane-units/',
    name: 'SaneUnits',
    navLabel: { zh: 'SaneUnits', en: 'SaneUnits' },
    description: { zh: '单位换算与实感估算', en: 'Unit conversion & estimation' },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<path d="M8 40h32M14 40V14M24 40V8M34 40V22"/><circle cx="14" cy="11" r="3"/><circle cx="24" cy="5" r="3"/><circle cx="34" cy="19" r="3"/>',
    },
    status: 'stable',
  }),
])

export function getStableApps() {
  return TOOLBOX_APPS.filter((app) => app.status === 'stable')
}

export function getAppById(id) {
  return TOOLBOX_APPS.find((app) => app.id === id)
}
