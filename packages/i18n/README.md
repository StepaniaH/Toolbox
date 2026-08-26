# @toolbox/i18n

Framework-agnostic i18n core + React wrapper for Toolbox apps.

## Usage

### Framework-agnostic (core)

```ts
import { createTranslator, getLang, setLang, onChange, intlLocale } from "@toolbox/i18n";

const t = createTranslator({ greeting: "Hello {{name}}!" });
t("greeting", { name: "World" }); // "Hello World!"

// A fallback translator resolves keys the primary map misses:
const zhHant = createTranslator(zhHantMap, createTranslator(zhMap));

setLang("en"); // persist to localStorage "toolbox-lang"
getLang();     // "en"

intlLocale("zh-Hant"); // "zh-TW" — use for every Intl.* call

onChange((lang) => console.log("switched to", lang));
```

### React

```tsx
import { I18nProvider, useTranslation } from "@toolbox/i18n/react";

function App() {
  return (
    <I18nProvider translations={{ zh: zhMap, "zh-Hant": zhHantMap, en: enMap }}>
      <Tool />
    </I18nProvider>
  );
}

function Tool() {
  const { lang, setLang, t } = useTranslation();
  return <p>{t("myKey")}</p>;
}
```

## Features

- `{{variable}}` interpolation
- Nested key lookup (`nav.about`)
- Optional fallback translator (the React provider chains zh-Hant → zh)
- SSR-safe (no `window` access during server render)
- Keeps `<html lang>` synchronized on initialization and every language change
- Shared translations: NavBar labels & common actions (zh/zh-Hant/en)
- App-level translation overlay via `I18nProvider`
- `intlLocale()` for `Intl` APIs, `assertTranslationParity()` for tests

## 本地化工程规范

所有 Toolbox 应用的本地化必须遵守以下规则；违反任何一条都会在类型检查、单元测试或
browser smoke 中暴露。

1. **三语必须完整接线。** `I18nProvider` 的 `translations` 类型要求 `zh`、`zh-Hant`、
   `en` 三个键同时存在；只传两语的记录无法通过编译。这是历史上「繁体渲染原始 key」
   事故的直接防线。
2. **zh-Hant 是生成物，不手写。** 繁体词表一律由 `pnpm gen:zh-hant`
   （`scripts/gen-zh-hant.mjs`，OpenCC cn→tw，仅构建期）从简体源生成并提交。修改任何简体文案后必须重新运行该脚本；
   生成文件出现手改内容视为缺陷。`pnpm check:contracts` 内置漂移守卫，提交内容与生成器
   输出不一致时直接失败。
3. **运行时回退链：zh-Hant → zh → key。** 即使某个繁体键缺失，UI 也只会短暂显示简体，
   永远不渲染原始 key。回退是兜底而非借口——缺失键仍会被规范 4 的测试拦截。
4. **键位齐平必须有测试。** 应用在单元测试中调用 `assertTranslationParity({ zh, "zh-Hant": …, en })`，
   任何一语缺键/多键都以测试失败命名第一个漂移键。
5. **禁止二元语言判断。** `lang === "zh" ? … : …` 会把 zh-Hant 静默落进英文或简体分支。
   文案一律走 `t()`；`Intl.*` 的 locale 一律用 `intlLocale(lang)`；确需分支时用
   `lang === "en"` 判断（zh 与 zh-Hant 共享中文形态）。
6. **`<html lang>` 归 core 所有。** 应用不得在 effect 中改写 `document.documentElement.lang`；
   `setLang()` 已按 `zh-CN` / `zh-TW` / `en` 同步。
7. **富文本拆段不嵌 HTML。** 词表叶子只能是字符串；加粗/代码片段拆成相邻的键，
   JSX 结构留在组件里（参见 crypto-lab `kbContent.*`）。
8. **browser smoke 禁止原始 key 泄漏。** 涉及语言切换的 smoke 应断言页面文本不包含
   顶层键名前缀（如 `tabs.`、`app.`）。

## 语言注册表与 zh-Hant

`registry.ts` 是界面语言的唯一事实源（nativeName、覆盖状态）。选择器副显示名由
`Intl.DisplayNames` 按当前界面语言生成。繁体中文源由 `scripts/gen-zh-hant.mjs`
（OpenCC cn→tw，仅构建期依赖）从简体源生成并提交；修改简体文案后重新运行该脚本，
不要手改生成文件。
