const zh = {
  brand: {
    title: "设置",
    lead: "外观与首页个性化，全部只保存在本机浏览器。",
  },
  appearance: {
    title: "外观",
    description: "明暗模式、配色风格与界面语言。",
    theme: "明暗模式",
    themeDark: "深色",
    themeLight: "浅色",
    family: "配色风格",
    language: "界面语言",
  },
  homepage: {
    title: "首页展示",
    description: "控制首页工具卡片的显示、数量与顺序。",
    hint: "更改立即生效并写入本机，可随时恢复默认。",
    moveUp: "上移",
    moveDown: "下移",
    hide: "隐藏",
    show: "显示",
    limit: "最多展示",
    limitAll: "全部",
    reset: "恢复默认",
    saved: "已保存",
  },
};

const en = {
  brand: {
    title: "Settings",
    lead: "Appearance and homepage personalization, stored only in this browser.",
  },
  appearance: {
    title: "Appearance",
    description: "Light or dark mode, palette family, and interface language.",
    theme: "Mode",
    themeDark: "Dark",
    themeLight: "Light",
    family: "Palette",
    language: "Language",
  },
  homepage: {
    title: "Homepage",
    description: "Control which tools appear on the homepage, how many, and in what order.",
    hint: "Changes apply immediately and stay on this device; reset anytime.",
    moveUp: "Move up",
    moveDown: "Move down",
    hide: "Hide",
    show: "Show",
    limit: "Show at most",
    limitAll: "All",
    reset: "Reset to defaults",
    saved: "Saved",
  },
};

import zhHant from "./translations.zh-hant.generated.json" with { type: "json" };

export const translations = { zh, "zh-Hant": zhHant, en };
