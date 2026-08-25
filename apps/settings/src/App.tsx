import { useEffect, useState, type ReactNode } from "react";
import { NavBar } from "@toolbox/nav";
import { ToolboxFooter } from "@toolbox/nav/ToolboxFooter.tsx";
import "@toolbox/nav/nav-bar.css";
import { useTranslation } from "@toolbox/i18n/react";
import { getLang, onChange, setLang, type Lang } from "@toolbox/i18n/core";
import {
  COVERED_LANGUAGES,
  languageDisplayName,
} from "@toolbox/i18n/registry";
import {
  clearHomepagePrefs,
  readHomepagePrefs,
  writeHomepagePrefs,
} from "@toolbox/prefs";
import { getStableApps, localizedText } from "@toolbox/app-manifest";
import "./styles.css";

const TOOLS = getStableApps().filter((app) => app.path !== "/");
const THEME_API = (window as unknown as {
  ToolboxTheme?: {
    getTheme?: () => "dark" | "light";
    setTheme?: (theme: "dark" | "light") => void;
    getThemeFamily?: () => string;
    setThemeFamily?: (family: string) => void;
    THEME_FAMILIES?: readonly string[];
  };
}).ToolboxTheme;

const FAMILIES = THEME_API?.THEME_FAMILIES ?? ["catppuccin"];
const FAMILY_SWATCHES: Record<string, { dark: string; light: string; accent: string }> = {
  catppuccin: { dark: "#303446", light: "#eff1f5", accent: "#8caaee" },
  gruvbox: { dark: "#282828", light: "#fbf1c7", accent: "#b8bb26" },
  solarized: { dark: "#002b36", light: "#fdf6e3", accent: "#2aa198" },
};
const FAMILY_LABELS: Record<string, string> = {
  catppuccin: "Catppuccin",
  gruvbox: "Gruvbox",
  solarized: "Solarized",
};

function useCurrentLang(): Lang {
  const [lang, setLangState] = useState<Lang>(getLang);
  useEffect(() => onChange(setLangState), []);
  return lang;
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="settings-card">{children}</div>
    </section>
  );
}

function toolName(id: string, lang: Lang): string {
  const app = TOOLS.find((tool) => tool.id === id);
  if (!app) return id;
  return app.presentation?.title
    ? localizedText(app.presentation.title, lang)
    : app.name ?? id;
}

function AppearanceSection() {
  const { t } = useTranslation();
  const lang = useCurrentLang();
  const [theme, setThemeState] = useState<"dark" | "light">(
    () => THEME_API?.getTheme?.() ?? "dark",
  );
  const [family, setFamilyState] = useState<string>(
    () => THEME_API?.getThemeFamily?.() ?? "catppuccin",
  );

  const applyFamily = (next: string) => {
    THEME_API?.setThemeFamily?.(next);
    setFamilyState(next);
  };

  const applyTheme = (next: "dark" | "light") => {
    THEME_API?.setTheme?.(next);
    setThemeState(next);
  };

  return (
    <Section title={t("appearance.title")} description={t("appearance.description")}>
      <div className="settings-row" role="group" aria-label={t("appearance.theme")}>
        <span className="settings-row-label">{t("appearance.theme")}</span>
        <div className="segmented">
          {(["dark", "light"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={theme === mode ? "segment is-active" : "segment"}
              aria-pressed={theme === mode}
              onClick={() => applyTheme(mode)}
            >
              {t(mode === "dark" ? "appearance.themeDark" : "appearance.themeLight")}
            </button>
          ))}
        </div>
      </div>
      {FAMILIES.length > 1 ? (
        <div className="settings-row" role="group" aria-label={t("appearance.family")}>
          <span className="settings-row-label">{t("appearance.family")}</span>
          <div className="swatches">
            {FAMILIES.map((name) => {
              const swatch = FAMILY_SWATCHES[name] ?? FAMILY_SWATCHES.catppuccin;
              return (
                <button
                  key={name}
                  type="button"
                  className={family === name ? "swatch is-active" : "swatch"}
                  aria-pressed={family === name}
                  title={name}
                  onClick={() => applyFamily(name)}
                >
                  <span
                    className="swatch-preview"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(135deg, ${swatch.dark} 50%, ${swatch.light} 50%)`,
                    }}
                  >
                    <i style={{ background: swatch.accent }} />
                  </span>
                  <span className="swatch-name">
                    {FAMILY_LABELS[name] ?? name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div
        className="settings-row settings-row-top"
        role="group"
        aria-label={t("appearance.language")}
      >
        <span className="settings-row-label">{t("appearance.language")}</span>
        <ul className="language-list">
          {COVERED_LANGUAGES.map((entry) => (
            <li key={entry.code}>
              <button
                type="button"
                lang={entry.code === "zh" ? "zh-CN" : entry.code}
                className={lang === entry.code ? "language-option is-active" : "language-option"}
                aria-pressed={lang === entry.code}
                onClick={() => setLang(entry.code as Lang)}
              >
                <span className="language-native">{entry.nativeName}</span>
                <span className="language-display" aria-hidden="true">
                  {languageDisplayName(entry.code, lang)}
                </span>
                {lang === entry.code ? <span className="language-check" aria-hidden="true">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function HomepageSection() {
  const { t } = useTranslation();
  const lang = useCurrentLang();
  const [prefs, setPrefs] = useState(() => readHomepagePrefs(TOOLS));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 1600);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const persist = (next: typeof prefs) => {
    writeHomepagePrefs(next, TOOLS);
    setPrefs(next);
    setSaved(true);
  };

  const visible = TOOLS.filter((tool) => !prefs.hiddenIds.includes(tool.id));
  const hidden = TOOLS.filter((tool) => prefs.hiddenIds.includes(tool.id));

  const toggleTool = (id: string) => {
    const hiddenIds = prefs.hiddenIds.includes(id)
      ? prefs.hiddenIds.filter((value) => value !== id)
      : [...prefs.hiddenIds, id];
    persist({ ...prefs, hiddenIds });
  };

  const move = (id: string, delta: -1 | 1) => {
    const order = [...prefs.order];
    const current = order.indexOf(id) === -1 ? order.length : order.indexOf(id);
    const target = current + delta;
    if (target < 0 || target >= visible.length) return;
    if (order.indexOf(id) === -1) order.push(id);
    [order[current], order[target]] = [order[target], order[current]];
    persist({ ...prefs, order });
  };

  return (
    <Section title={t("homepage.title")} description={t("homepage.description")}>
      <p className="settings-hint">{t("homepage.hint")}</p>
      <ul className="tool-list">
        {visible.map((tool, index) => (
          <li key={tool.id} className="tool-row">
            <span className="tool-name">{toolName(tool.id, lang)}</span>
            <span className="tool-actions">
              <button type="button" aria-label={t("homepage.moveUp")} disabled={index === 0} onClick={() => move(tool.id, -1)}>↑</button>
              <button type="button" aria-label={t("homepage.moveDown")} disabled={index === visible.length - 1} onClick={() => move(tool.id, 1)}>↓</button>
              <button type="button" className="danger" onClick={() => toggleTool(tool.id)}>{t("homepage.hide")}</button>
            </span>
          </li>
        ))}
        {hidden.map((tool) => (
          <li key={tool.id} className="tool-row is-hidden">
            <span className="tool-name">{toolName(tool.id, lang)}</span>
            <span className="tool-actions">
              <button type="button" onClick={() => toggleTool(tool.id)}>{t("homepage.show")}</button>
            </span>
          </li>
        ))}
      </ul>
      <div className="settings-row">
        <label className="settings-row-label" htmlFor="homepage-limit">{t("homepage.limit")}</label>
        <input
          id="homepage-limit"
          className="limit-input"
          type="number"
          min={1}
          max={TOOLS.length}
          value={prefs.limit ?? ""}
          placeholder={t("homepage.limitAll")}
          onChange={(event) => {
            const raw = event.target.value;
            persist({ ...prefs, limit: raw === "" ? null : Number(raw) });
          }}
        />
      </div>
      <div className="settings-footer">
        <button
          type="button"
          className="reset"
          onClick={() => {
            clearHomepagePrefs();
            setPrefs(readHomepagePrefs(TOOLS));
            setSaved(true);
          }}
        >
          {t("homepage.reset")}
        </button>
        <span className="saved" role="status">{saved ? t("homepage.saved") : ""}</span>
      </div>
    </Section>
  );
}

export default function App() {
  const { t } = useTranslation();
  return (
    <>
      <NavBar currentApp="settings" />
      <main className="page">
        <header className="settings-header">
          <h1>{t("brand.title")}</h1>
          <p>{t("brand.lead")}</p>
        </header>
        <AppearanceSection />
        <HomepageSection />
      </main>
      <div className="page settings-footer-page">
        <ToolboxFooter appId="settings" />
      </div>
    </>
  );
}
