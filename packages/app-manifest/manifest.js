export const APP_STATUSES = Object.freeze(['hidden', 'preview', 'stable'])
export const TOOLBOX_RELEASE = 'v0.2.4'

export function defineApp(input) {
  const app = {
    status: 'hidden',
    ...input,
    navId: input.navId ?? input.id,
    navLabel: Object.freeze({ ...input.navLabel }),
    description: Object.freeze({ ...input.description }),
    keywords: Object.freeze({
      zh: Object.freeze([...(input.keywords?.zh ?? [])]),
      en: Object.freeze([...(input.keywords?.en ?? [])]),
    }),
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
    keywords: {
      zh: ['首页', '工具箱', '工具合集', '导航'],
      en: ['home', 'toolbox', 'tools', 'directory'],
    },
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
    keywords: {
      zh: ['AI', '模型', '价格', '倍率', '汇率', '充值', '扣费', '反推', '令牌'],
      en: ['AI', 'model', 'pricing', 'rate', 'exchange', 'recharge', 'billing', 'reverse', 'token'],
    },
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
    keywords: {
      zh: ['日期', '时间', '时区', '间隔', '偏移', '夏令时', '农历', '节气', '工作日'],
      en: ['date', 'time', 'timezone', 'interval', 'offset', 'DST', 'lunar', 'solar term', 'workday'],
    },
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
    keywords: {
      zh: ['显示器', '屏幕', 'PPI', 'PPD', '清晰度', '分辨率', '观看距离', '色域', '面板', '带宽'],
      en: ['monitor', 'display', 'screen', 'PPI', 'PPD', 'sharpness', 'resolution', 'viewing distance', 'color gamut', 'panel', 'bandwidth'],
    },
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
    keywords: {
      zh: ['单位', '换算', '存储', '容量', '带宽', '网速', '视频', '码率', '功耗', '电费'],
      en: ['unit', 'conversion', 'storage', 'capacity', 'bandwidth', 'network speed', 'video', 'bitrate', 'power', 'electricity'],
    },
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
