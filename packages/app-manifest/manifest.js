export const APP_STATUSES = Object.freeze(['hidden', 'preview', 'stable'])

export function defineApp(input) {
  const app = {
    status: 'hidden',
    ...input,
    navId: input.navId ?? input.id,
    navLabel: Object.freeze({ ...input.navLabel }),
    description: Object.freeze({ ...input.description }),
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
    status: 'stable',
  }),
  defineApp({
    id: 'rate-lens',
    path: '/rate-lens/',
    name: 'RateLens',
    navLabel: { zh: 'RateLens', en: 'RateLens' },
    description: { zh: 'AI 模型价格倍率计算器', en: 'AI model pricing calculator' },
    status: 'stable',
  }),
  defineApp({
    id: 'chrono-sphere',
    path: '/chrono-sphere/',
    name: 'ChronoSphere',
    navLabel: { zh: 'ChronoSphere', en: 'ChronoSphere' },
    description: { zh: '日期与时区工具', en: 'Date & timezone utility' },
    status: 'stable',
  }),
  defineApp({
    id: 'monitor-choice',
    path: '/monitor-choice/',
    name: 'Monitor Choice',
    navLabel: { zh: 'Monitor Choice', en: 'Monitor Choice' },
    description: { zh: '显示器参数实验室', en: 'Display parameter lab' },
    status: 'stable',
  }),
  defineApp({
    id: 'sane-units',
    path: '/sane-units/',
    name: 'SaneUnits',
    navLabel: { zh: 'SaneUnits', en: 'SaneUnits' },
    description: { zh: '单位换算与实感估算', en: 'Unit conversion & estimation' },
    status: 'stable',
  }),
])

export function getStableApps() {
  return TOOLBOX_APPS.filter((app) => app.status === 'stable')
}

export function getAppById(id) {
  return TOOLBOX_APPS.find((app) => app.id === id)
}
