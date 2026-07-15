/* ==========================================================================
   i18n — Chinese / English translations
   ========================================================================== */

import {
  getLang as getCoreLang,
  onChange,
  setLang as setCoreLang,
} from "@toolbox/i18n/core";

const i18n = {
  zh: {
    "site.title": "工具箱",
    "site.tagline": "别人略过的，工具都算上了。",
    "nav.lang": "EN",
    "nav.langTitle": "Switch to English",
    "nav.theme": "🌓",
    "nav.themeTitle": "切换明暗主题",

    "card.ratelens.title": "RateLens",
    "card.ratelens.subtitle": "AI 模型价格倍率计算器",
    "card.ratelens.desc": "倍率正算与扣费反推，实时换算 AI 模型实付价格与官方成本对比。",

    "card.chrono.title": "ChronoSphere",
    "card.chrono.subtitle": "日期与时间工具",
    "card.chrono.desc": "时区偏移推算、日期间隔计算（明确起止端点，杜绝模糊计数）、夏令时变更审计、中国农历与节气转换。",

    "card.monitor.title": "Monitor Choice",
    "card.monitor.subtitle": "显示器参数实验室",
    "card.monitor.desc": "PPI 清晰度计算、3D 观看距离模拟、色彩空间对比、面板技术百科。帮你做出自己的选择。",

    "card.sane.title": "SaneUnits",
    "card.sane.subtitle": "单位换算与实感估算",
    "card.sane.desc": "存储进制混淆、网络带宽换算、视频码率推算、电器功耗估算——用真实数据打破单位迷雾。",

    "card.formtran.title": "FormTran",
    "card.formtran.subtitle": "本地文件处理工作台",
    "card.formtran.desc": "识别、转换、合成与检查文件，从输入到结果都留在浏览器本地。",

    "card.cryptolab.title": "CryptoLab",
    "card.cryptolab.subtitle": "本地密码学与安全分享",
    "card.cryptolab.desc": "在浏览器本地完成编码、摘要、加解密、JWT 检查，以及公钥二维码安全分享。",

    "card.cta": "打开工具",

    "footer.privacy": "零追踪 · 零 Cookie · 系统字体",
    "footer.source": "源码",
  },

  en: {
    "site.title": "Toolbox",
    "site.tagline": "What others skip, these tools count.",
    "nav.lang": "中文",
    "nav.langTitle": "切换到中文",
    "nav.theme": "🌓",
    "nav.themeTitle": "Toggle theme",

    "card.ratelens.title": "RateLens",
    "card.ratelens.subtitle": "AI Model Pricing Calculator",
    "card.ratelens.desc": "Forward and reverse rate calculation for AI model pricing.",

    "card.chrono.title": "ChronoSphere",
    "card.chrono.subtitle": "Date & Time Utility",
    "card.chrono.desc": "Timezone-aware date offsets, interval calculation with explicit endpoint counting, DST transition auditing, and Chinese lunar calendar with solar terms.",

    "card.monitor.title": "Monitor Choice",
    "card.monitor.subtitle": "Display Parameter Lab",
    "card.monitor.desc": "PPI sharpness, 3D viewing distance, color space comparison, panel technology encyclopedia. Make your own informed choice.",

    "card.sane.title": "SaneUnits",
    "card.sane.subtitle": "Unit Conversion & Estimation",
    "card.sane.desc": "Storage binary confusion, network bandwidth math, video bitrate solving, power consumption estimation — real numbers, no BS.",

    "card.formtran.title": "FormTran",
    "card.formtran.subtitle": "Local File Workspace",
    "card.formtran.desc": "Identify, convert, compose, and inspect files while keeping every input and result in your browser.",

    "card.cryptolab.title": "CryptoLab",
    "card.cryptolab.subtitle": "Local Cryptography & Secure Sharing",
    "card.cryptolab.desc": "Encode, hash, encrypt, inspect JWTs, and exchange public-key protected QR messages entirely in your browser.",

    "card.cta": "Open Tool",

    "footer.privacy": "No tracking · No cookies · System fonts",
    "footer.source": "Source",
  },
};

export function getLang() {
  return getCoreLang();
}

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (i18n[lang]?.[key]) {
      el.textContent = i18n[lang][key];
    }
  });
  // Update lang toggle button text
  const toggle = document.getElementById("langToggle");
  if (toggle) toggle.textContent = i18n[lang]["nav.lang"];
  // Update HTML lang attr
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
}

export function setLang(lang) {
  setCoreLang(lang);
  applyTranslations(lang);
}

export function toggleLang() {
  const current = document.documentElement.lang.startsWith("zh") ? "zh" : "en";
  setLang(current === "zh" ? "en" : "zh");
}

onChange(applyTranslations);
