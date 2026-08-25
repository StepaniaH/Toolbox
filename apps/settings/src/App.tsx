import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { NavBar } from "@toolbox/nav";
import { ToolboxFooter } from "@toolbox/nav/ToolboxFooter.tsx";
import "@toolbox/nav/nav-bar.css";
import { useTranslation } from "@toolbox/i18n/react";
import { getLang, onChange, setLang, type Lang } from "@toolbox/i18n/core";
import { COVERED_LANGUAGES } from "@toolbox/i18n/registry";
import {
  clearHomepagePrefs,
  readHomepagePrefs,
  writeHomepagePrefs,
} from "@toolbox/prefs";
import { getStableApps, localizedText } from "@toolbox/app-manifest";
import "./styles.css";

const TOOLS = getStableApps().filter(
  (app) => app.path !== "/" && app.presentation?.card !== false,
);
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

function LanguageSelect({ value, onChange, label }: { value: Lang; onChange: (lang: Lang) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(Math.max(0, COVERED_LANGUAGES.findIndex((entry) => entry.code === value)));
    menuRef.current?.focus();
  }, [open, value]);

  useEffect(() => {
    menuRef.current
      ?.querySelectorAll<HTMLElement>("[role='option']")
      [activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const choose = (code: string) => {
    onChange(code as Lang);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, COVERED_LANGUAGES.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(COVERED_LANGUAGES[activeIndex].code);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const current = COVERED_LANGUAGES.find((entry) => entry.code === value) ?? COVERED_LANGUAGES[0];

  return (
    <div className={open ? "language-select is-open" : "language-select"} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="language-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((state) => !state)}
        onKeyDown={onTriggerKeyDown}
      >
        <span lang={value === "zh" ? "zh-CN" : value}>{current.nativeName}</span>
        <svg className="language-caret" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul className="language-menu" role="listbox" aria-label={label} tabIndex={-1} ref={menuRef} onKeyDown={onMenuKeyDown}>
          {COVERED_LANGUAGES.map((entry, index) => (
            <li
              key={entry.code}
              role="option"
              aria-selected={entry.code === value}
              lang={entry.code === "zh" ? "zh-CN" : entry.code}
              className={index === activeIndex ? "language-menu-item is-active" : "language-menu-item"}
              onPointerEnter={() => setActiveIndex(index)}
              onClick={() => choose(entry.code)}
            >
              <span>{entry.nativeName}</span>
              {entry.code === value ? (
                <span className="language-check" aria-hidden="true">✓</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
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
      <div className="settings-row" role="group" aria-label={t("appearance.language")}>
        <span className="settings-row-label">{t("appearance.language")}</span>
        <LanguageSelect value={lang} onChange={setLang} label={t("appearance.language")} />
      </div>
    </Section>
  );
}

function HomepageSection() {
  const { t } = useTranslation();
  const lang = useCurrentLang();
  const [prefs, setPrefs] = useState(() => readHomepagePrefs(TOOLS));
  const [saved, setSaved] = useState(false);
  const [movedId, setMovedId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const prevTops = useRef<Map<string, number>>(new Map());
  const pendingMove = useRef<string | null>(null);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 1600);
    return () => window.clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    if (!movedId) return;
    const timer = window.setTimeout(() => setMovedId(null), 500);
    return () => window.clearTimeout(timer);
  }, [movedId]);

  const persist = (next: typeof prefs) => {
    writeHomepagePrefs(next, TOOLS);
    setPrefs(next);
    setSaved(true);
  };

  const hiddenSet = new Set(prefs.hiddenIds);
  const rank = new Map(prefs.order.map((id, index) => [id, index]));
  const visible = TOOLS.filter((tool) => !hiddenSet.has(tool.id)).sort((a, b) => {
    const ra = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ra === rb ? 0 : ra - rb;
  });
  const hidden = TOOLS.filter((tool) => hiddenSet.has(tool.id));

  const captureRowTops = () => {
    const tops = new Map<string, number>();
    listRef.current
      ?.querySelectorAll<HTMLElement>("[data-tool-id]")
      .forEach((el) => tops.set(el.dataset.toolId!, el.getBoundingClientRect().top));
    prevTops.current = tops;
  };

  useLayoutEffect(() => {
    const container = listRef.current;
    if (!container || prevTops.current.size === 0) return;
    const previousTops = prevTops.current;
    prevTops.current = new Map();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    container.querySelectorAll<HTMLElement>("[data-tool-id]").forEach((el) => {
      const id = el.dataset.toolId!;
      const previousTop = previousTops.get(id);
      if (previousTop === undefined) return;
      const delta = previousTop - el.getBoundingClientRect().top;
      if (Math.abs(delta) < 1) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 200ms ease";
        el.style.transform = "";
      });
    });
    if (pendingMove.current) {
      setMovedId(pendingMove.current);
      pendingMove.current = null;
    }
  });

  const toggleTool = (id: string) => {
    const hiddenIds = prefs.hiddenIds.includes(id)
      ? prefs.hiddenIds.filter((value) => value !== id)
      : [...prefs.hiddenIds, id];
    persist({ ...prefs, hiddenIds });
  };

  const move = (id: string, delta: -1 | 1) => {
    const from = visible.findIndex((tool) => tool.id === id);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= visible.length) return;
    captureRowTops();
    pendingMove.current = id;
    const nextOrder = visible.map((tool) => tool.id);
    [nextOrder[from], nextOrder[to]] = [nextOrder[to], nextOrder[from]];
    persist({ ...prefs, order: nextOrder });
  };

  return (
    <Section title={t("homepage.title")} description={t("homepage.description")}>
      <p className="settings-hint">{t("homepage.hint")}</p>
      <ul className="tool-list" ref={listRef}>
        {visible.map((tool, index) => (
          <li
            key={tool.id}
            data-tool-id={tool.id}
            className={movedId === tool.id ? "tool-row is-moved" : "tool-row"}
          >
            <span className="tool-name">{toolName(tool.id, lang)}</span>
            <span className="tool-actions">
              <button type="button" aria-label={t("homepage.moveUp")} disabled={index === 0} onClick={() => move(tool.id, -1)}>↑</button>
              <button type="button" aria-label={t("homepage.moveDown")} disabled={index === visible.length - 1} onClick={() => move(tool.id, 1)}>↓</button>
              <button type="button" className="danger" onClick={() => toggleTool(tool.id)}>{t("homepage.hide")}</button>
            </span>
          </li>
        ))}
        {hidden.map((tool) => (
          <li key={tool.id} data-tool-id={tool.id} className="tool-row is-hidden">
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
