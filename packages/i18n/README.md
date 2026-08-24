# @toolbox/i18n

Framework-agnostic i18n core + React wrapper for Toolbox apps.

## Usage

### Framework-agnostic (core)

```ts
import { createTranslator, getLang, setLang, onChange } from "@toolbox/i18n";

const t = createTranslator({ greeting: "Hello {{name}}!" });
t("greeting", { name: "World" }); // "Hello World!"

setLang("en"); // persist to localStorage "toolbox-lang"
getLang();     // "en"

onChange((lang) => console.log("switched to", lang));
```

### React

```tsx
import { I18nProvider, useTranslation } from "@toolbox/i18n/react";

function App() {
  return (
    <I18nProvider translations={{ zh: { myKey: "我的文本" }, en: { myKey: "My text" } }}>
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
- SSR-safe (no `window` access during server render)
- Keeps `<html lang>` synchronized on initialization and every language change
- Shared translations: NavBar labels & common actions (zh/en)
- App-level translation overlay via `I18nProvider`

## 语言注册表与 zh-Hant

`registry.ts` 是界面语言的唯一事实源（nativeName、覆盖状态）。选择器副显示名由
`Intl.DisplayNames` 按当前界面语言生成。繁体中文源由 `scripts/gen-zh-hant.mjs`
（OpenCC cn→tw，仅构建期依赖）从简体源生成并提交；修改简体文案后重新运行该脚本，
不要手改生成文件。
