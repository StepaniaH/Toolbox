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
- Shared translations: NavBar labels & common actions (zh/en)
- App-level translation overlay via `I18nProvider`
