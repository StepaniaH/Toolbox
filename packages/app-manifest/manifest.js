export const APP_STATUSES = Object.freeze(['hidden', 'preview', 'stable'])
export const TOOLBOX_RELEASE = 'v0.6.0'

export function defineApp(input) {
  const app = {
    status: 'hidden',
    ...input,
    navId: input.navId ?? input.id,
    navLabel: Object.freeze({ ...input.navLabel }),
    description: Object.freeze({ ...input.description }),
    keywords: Object.freeze({
      zh: Object.freeze([...(input.keywords?.zh ?? [])]),
      ...(input.keywords?.zhHant
        ? { zhHant: Object.freeze([...input.keywords.zhHant]) }
        : {}),
      en: Object.freeze([...(input.keywords?.en ?? [])]),
    }),
    icon: Object.freeze({ ...input.icon }),
  }
  if (app.presentation) {
    app.presentation = Object.freeze({
      card: app.presentation.card !== false,
      title: app.presentation.title ? Object.freeze({ ...app.presentation.title }) : undefined,
      subtitle: Object.freeze({ ...app.presentation.subtitle }),
      description: Object.freeze({ ...app.presentation.description }),
      badges: Object.freeze([...app.presentation.badges]),
    })
  }
  return Object.freeze(app)
}

export const TOOLBOX_APPS = Object.freeze([
  defineApp({
    id: 'homepage',
    navId: 'home',
    path: '/',
    name: 'Toolbox',
    navLabel: { zh: '首页', zhHant: "首頁", en: 'Home' },
    description: { zh: 'Toolbox 导航中心', zhHant: "Toolbox 導航中心", en: 'Toolbox navigation hub' },
    keywords: {
      zh: ['首页', '工具箱', '工具合集', '导航'],
      zhHant: ['首頁', '工具箱', '工具合集', '導航'],
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
    navLabel: { zh: 'RateLens', zhHant: "RateLens", en: 'RateLens' },
    description: { zh: 'AI 模型价格倍率计算器', zhHant: "AI 模型價格倍率計算器", en: 'AI model pricing calculator' },
    keywords: {
      zh: ['AI', '模型', '价格', '倍率', '汇率', '充值', '扣费', '反推', '令牌'],
      zhHant: ['AI', '模型', '價格', '倍率', '匯率', '充值', '扣費', '反推', '令牌'],
      en: ['AI', 'model', 'pricing', 'rate', 'exchange', 'recharge', 'billing', 'reverse', 'token'],
    },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<rect x="8" y="8" width="32" height="32" rx="6"/><circle cx="24" cy="20" r="7"/><path d="M24 13V8"/><circle cx="22" cy="19" r="1.5" class="app-icon-fill"/>',
    },
    presentation: {
      subtitle: { zh: 'AI 模型价格倍率计算器', zhHant: "AI 模型價格倍率計算器", en: 'AI Model Pricing Calculator' },
      description: {
        zh: '倍率正算与扣费反推，实时换算 AI 模型实付价格与官方成本对比。',
        zhHant: "倍率正算與扣費反推，實時換算 AI 模型實付價格與官方成本對比。",
        en: 'Forward and reverse rate calculation for AI model pricing.',
      },
      badges: ['React', 'TypeScript', 'Vite', 'Tailwind'],
    },
    status: 'stable',
  }),
  defineApp({
    id: 'chrono-sphere',
    path: '/chrono-sphere/',
    name: 'ChronoSphere',
    navLabel: { zh: 'ChronoSphere', zhHant: "ChronoSphere", en: 'ChronoSphere' },
    description: { zh: '日期与时区工具', zhHant: "日期與時區工具", en: 'Date & timezone utility' },
    keywords: {
      zh: ['日期', '时间', '时区', '间隔', '偏移', '夏令时', '农历', '节气', '工作日'],
      zhHant: ['日期', '時間', '時區', '間隔', '偏移', '夏令時', '農曆', '節氣', '工作日'],
      en: ['date', 'time', 'timezone', 'interval', 'offset', 'DST', 'lunar', 'solar term', 'workday'],
    },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<circle cx="24" cy="24" r="19"/><circle cx="24" cy="24" r="2" class="app-icon-fill"/><path d="M24 24V11M24 24l7-6"/><circle cx="24" cy="24" r="14" opacity=".25"/>',
    },
    presentation: {
      subtitle: { zh: '日期与时间工具', zhHant: "日期與時間工具", en: 'Date & Time Utility' },
      description: {
        zh: '时区偏移推算、日期间隔计算（明确起止端点，杜绝模糊计数）、夏令时变更审计、中国农历与节气转换。',
        zhHant: "時區偏移推算、日期間隔計算（明確起止端點，杜絕模糊計數）、夏令時變更審計、中國農曆與節氣轉換。",
        en: 'Timezone-aware date offsets, interval calculation with explicit endpoint counting, DST transition auditing, and Chinese lunar calendar with solar terms.',
      },
      badges: ['React', 'TypeScript', 'Vite'],
    },
    status: 'stable',
  }),
  defineApp({
    id: 'monitor-choice',
    path: '/monitor-choice/',
    name: 'Monitor Choice',
    navLabel: { zh: 'Monitor Choice', zhHant: "Monitor Choice", en: 'Monitor Choice' },
    description: { zh: '显示器参数实验室', zhHant: "顯示器參數實驗室", en: 'Display parameter lab' },
    keywords: {
      zh: ['显示器', '屏幕', 'PPI', 'PPD', '清晰度', '分辨率', '观看距离', '色域', '面板', '带宽'],
      zhHant: ['顯示器', '屏幕', 'PPI', 'PPD', '清晰度', '分辨率', '觀看距離', '色域', '面板', '帶寬'],
      en: ['monitor', 'display', 'screen', 'PPI', 'PPD', 'sharpness', 'resolution', 'viewing distance', 'color gamut', 'panel', 'bandwidth'],
    },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<rect x="8" y="8" width="32" height="22" rx="3"/><path d="M20 34h8M24 30v6"/><rect x="16" y="12" width="16" height="12" rx="1" opacity=".4"/>',
    },
    presentation: {
      subtitle: { zh: '显示器参数实验室', zhHant: "顯示器參數實驗室", en: 'Display Parameter Lab' },
      description: {
        zh: 'PPI 清晰度计算、3D 观看距离模拟、色彩空间对比、面板技术百科。帮你做出自己的选择。',
        zhHant: "PPI 清晰度計算、3D 觀看距離模擬、色彩空間對比、面板技術百科。幫你做出自己的選擇。",
        en: 'PPI sharpness, 3D viewing distance, color space comparison, panel technology encyclopedia. Make your own informed choice.',
      },
      badges: ['Vanilla JS', 'Canvas 2D'],
    },
    status: 'stable',
  }),
  defineApp({
    id: 'sane-units',
    path: '/sane-units/',
    name: 'SaneUnits',
    navLabel: { zh: 'SaneUnits', zhHant: "SaneUnits", en: 'SaneUnits' },
    description: { zh: '单位换算与实感估算', zhHant: "單位換算與實感估算", en: 'Unit conversion & estimation' },
    keywords: {
      zh: ['单位', '换算', '存储', '容量', '带宽', '网速', '视频', '码率', '功耗', '电费'],
      zhHant: ['單位', '換算', '存儲', '容量', '帶寬', '網速', '視頻', '碼率', '功耗', '電費'],
      en: ['unit', 'conversion', 'storage', 'capacity', 'bandwidth', 'network speed', 'video', 'bitrate', 'power', 'electricity'],
    },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<path d="M8 40h32M14 40V14M24 40V8M34 40V22"/><circle cx="14" cy="11" r="3"/><circle cx="24" cy="5" r="3"/><circle cx="34" cy="19" r="3"/>',
    },
    presentation: {
      subtitle: { zh: '单位换算与实感估算', zhHant: "單位換算與實感估算", en: 'Unit Conversion & Estimation' },
      description: {
        zh: '存储进制混淆、网络带宽换算、视频码率推算、电器功耗估算——用真实数据打破单位迷雾。',
        zhHant: "存儲進制混淆、網絡帶寬換算、視頻碼率推算、電器功耗估算——用真實數據打破單位迷霧。",
        en: 'Storage binary confusion, network bandwidth math, video bitrate solving, power consumption estimation — real numbers, no BS.',
      },
      badges: ['React', 'Vite'],
    },
    status: 'stable',
  }),
  defineApp({
    id: 'image-converter',
    path: '/image-converter/',
    name: 'FormTran',
    navLabel: { zh: 'FormTran', zhHant: "FormTran", en: 'FormTran' },
    description: { zh: '从识别到处理，每一步都留在本机', zhHant: "從識別到處理，每一步都留在本機", en: 'From identification to processing, every step stays on your device' },
    keywords: {
      zh: ['文件工具', '图片', '图像', '格式转换', '批量转换', '压缩', '编辑', 'GIF', '动图', 'PDF', '压缩包', '表格', 'XLSX', 'CSV', 'TSV', 'HEIC', 'HEIF', '重命名', '正则', 'Markdown', 'JSON', '文本标记', 'PNG', 'JPEG', 'WebP'],
      zhHant: ['文件工具', '圖片', '圖像', '格式轉換', '批量轉換', '壓縮', '編輯', 'GIF', '動圖', 'PDF', '壓縮包', '表格', 'XLSX', 'CSV', 'TSV', 'HEIC', 'HEIF', '重命名', '正則', 'Markdown', 'JSON', '文本標記', 'PNG', 'JPEG', 'WebP'],
      en: ['file tools', 'image', 'photo', 'format converter', 'batch conversion', 'compress', 'edit', 'GIF', 'animation', 'PDF', 'archive', 'spreadsheet', 'table', 'XLSX', 'CSV', 'TSV', 'HEIC', 'HEIF', 'rename', 'regex', 'Markdown', 'JSON', 'text markup', 'PNG', 'JPEG', 'WebP'],
    },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<rect x="7" y="10" width="27" height="27" rx="5"/><path d="m11 31 7-8 5 5 4-4 7 7M17 18h.01M31 7l7 5-7 5M38 12H27M17 41l-7-5 7-5M10 36h11"/>',
    },
    presentation: {
      subtitle: { zh: '本地文件处理工作台', zhHant: "本地文件處理工作臺", en: 'Local File Workspace' },
      description: {
        zh: '识别、转换、合成与检查文件，从输入到结果都留在浏览器本地。',
        zhHant: "識別、轉換、合成與檢查文件，從輸入到結果都留在瀏覽器本地。",
        en: 'Identify, convert, compose, and inspect files while keeping every input and result in your browser.',
      },
      badges: ['React', 'TypeScript', 'Vite'],
    },
    status: 'stable',
  }),
  defineApp({
    id: 'crypto-lab',
    path: '/crypto-lab/',
    name: 'CryptoLab',
    navLabel: { zh: 'CryptoLab', zhHant: "CryptoLab", en: 'CryptoLab' },
    description: { zh: '本地密码学与公钥二维码安全分享工具', zhHant: "本地密碼學與公鑰二維碼安全分享工具", en: 'Local cryptography and public-key QR sharing' },
    keywords: {
      zh: ['Base64', 'URL 编码', 'HTML 实体', 'Hex', '进制转换', 'MD5', 'SHA', 'HMAC', '哈希', 'AES', 'ChaCha20', 'RSA', 'JWT', '加密', '解密', '签名', '密码学', '二维码', '公钥', '私钥', '安全分享'],
      zhHant: ['Base64', 'URL 編碼', 'HTML 實體', 'Hex', '進制轉換', 'MD5', 'SHA', 'HMAC', '哈希', 'AES', 'ChaCha20', 'RSA', 'JWT', '加密', '解密', '簽名', '密碼學', '二維碼', '公鑰', '私鑰', '安全分享'],
      en: ['Base64', 'URL encode', 'HTML entity', 'Hex', 'radix', 'MD5', 'SHA', 'HMAC', 'hash', 'AES', 'ChaCha20', 'RSA', 'JWT', 'encrypt', 'decrypt', 'sign', 'cryptography', 'QR code', 'public key', 'private key', 'secure share'],
    },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<circle cx="22" cy="24" r="7"/><path d="M33 24h6v6h-6z"/><path d="M39 24V18"/><path d="M15 24H9"/><path d="M22 31v7"/>',
    },
    presentation: {
      subtitle: { zh: '本地密码学与安全分享', zhHant: "本地密碼學與安全分享", en: 'Local Cryptography & Secure Sharing' },
      description: {
        zh: '在浏览器本地完成编码、摘要、加解密、JWT 检查，以及公钥二维码安全分享。',
        zhHant: "在瀏覽器本地完成編碼、摘要、加解密、JWT 檢查，以及公鑰二維碼安全分享。",
        en: 'Encode, hash, encrypt, inspect JWTs, and exchange public-key protected QR messages entirely in your browser.',
      },
      badges: ['React', 'TypeScript', 'Web Crypto'],
    },
    status: 'stable',
  }),
  defineApp({
    id: 'settings',
    path: '/settings/',
    name: 'Settings',
    navLabel: { zh: '设置', zhHant: "設置", en: 'Settings' },
    description: { zh: '外观与首页个性化偏好', zhHant: "外觀與首頁個性化偏好", en: 'Appearance and homepage preferences' },
    keywords: {
      zh: ['设置', '偏好', '主题', '语言', '首页', '排序', '隐藏'],
      zhHant: ['設置', '偏好', '主題', '語言', '首頁', '排序', '隱藏'],
      en: ['settings', 'preferences', 'theme', 'language', 'homepage', 'order', 'hide'],
    },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<circle cx="24" cy="24" r="6"/><path d="M24 8v5M24 35v5M8 24h5M35 24h5M13 13l3.5 3.5M31.5 31.5L35 35M35 13l-3.5 3.5M16.5 31.5L13 35"/>',
    },
    presentation: {
      card: false,
      subtitle: { zh: '外观与首页偏好', zhHant: "外觀與首頁偏好", en: 'Appearance & homepage prefs' },
      description: {
        zh: '调整明暗主题、界面语言与首页工具的展示、数量和顺序，全部保存在本机。',
        zhHant: "調整明暗主題、界面語言與首頁工具的展示、數量和順序，全部保存在本機。",
        en: 'Adjust theme, language, and which tools the homepage shows, how many, and in what order. Stored locally.',
      },
      badges: ['React', 'TypeScript'],
    },
    status: 'stable',
  }),
])

export function localizedText(text, lang) {
  if (lang === 'en') return text.en
  if (lang === 'zh-Hant') return text.zhHant ?? text.zh
  return text.zh
}

export function localizedKeywords(keywords, lang) {
  if (lang === 'en') return keywords.en
  if (lang === 'zh-Hant') return keywords.zhHant ?? keywords.zh
  return keywords.zh
}

export function getStableApps() {
  return TOOLBOX_APPS.filter((app) => app.status === 'stable')
}

export function getAppById(id) {
  return TOOLBOX_APPS.find((app) => app.id === id)
}
