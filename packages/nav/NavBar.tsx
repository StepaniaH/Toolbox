// @toolbox/nav — React navigation bar.
//
// Drop-in `<NavBar />` for the React + Vite apps (rate-lens, chrono-sphere,
// sane-units). Mirrors the vanilla `nav-bar.js` bar: left Toolbox dropdown
// (active tool highlighted) and right theme + language controls. The left
// dropdown is the single tool switcher on both desktop and mobile.
//
// Pair with `@toolbox/nav/nav-bar.css` and `@toolbox/theme` (index.css +
// toggle.js). The theme toggle delegates to `window.ToolboxTheme.toggleTheme`
// by default — pass `onToggleTheme` to override. `currentApp` highlights the
// matching link and should match a `NavApp["id"]` from `NAV_APPS` below.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { setLang, getLang, onChange } from "@toolbox/i18n";
import { getStableApps } from "@toolbox/app-manifest";

const LANGUAGES = [
  { code: "zh", label: "中文（简体）", lang: "zh-CN" },
  { code: "en", label: "English", lang: "en" },
] as const;

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export type NavApp = {
  id: string;
  label: string;
  labelEn?: string;
  href: string;
  desc: string;
  descEn?: string;
  keywords: readonly string[];
  keywordsEn?: readonly string[];
};

/** Navigation projection of the canonical public app manifest. */
export const NAV_APPS: NavApp[] = getStableApps().map((app) => ({
  id: app.navId,
  label: app.navLabel.zh,
  labelEn: app.navLabel.en,
  href: app.path,
  desc: app.description.zh,
  descEn: app.description.en,
  keywords: app.keywords.zh,
  keywordsEn: app.keywords.en,
}));

/** Resolve `?lang=`-aware label/desc. Apps without an i18n context just get zh. */
function pick<T>(zh: T, en: T | undefined, preferEn: boolean): T {
  return preferEn && en !== undefined ? en : zh;
}

export type NavBarProps = {
  /** id of the active app (matches NavApp.id). Highlights that link. */
  currentApp?: string;
  /** Override the default tool list. */
  apps?: NavApp[];
  /** Override the theme-toggle handler. Defaults to window.ToolboxTheme.toggleTheme. */
  onToggleTheme?: () => void;
  /** "zh" | "en". Defaults to localStorage("toolbox-lang") → navigator.language. */
  lang?: "zh" | "en";
  /** Optional React nodes rendered before the theme button on the right edge. */
  rightSlot?: ReactNode;
  /** Extra className on the root <header>. */
  className?: string;
};

export function NavBar({
  currentApp,
  apps = NAV_APPS,
  onToggleTheme,
  lang,
  rightSlot,
  className,
}: NavBarProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [toolQuery, setToolQuery] = useState("");
  const [resolvedLang, setResolvedLang] = useState<"zh" | "en">(
    lang ?? getLang,
  );

  useEffect(() => {
    if (lang) {
      setResolvedLang(lang);
      return;
    }
    // Keep in sync with the global language (setLang from this bar or any
    // other component) via the @toolbox/i18n core's onChange channel.
    return onChange(setResolvedLang);
  }, [lang]);

  const preferEn = resolvedLang === "en";
  const normalizedQuery = toolQuery.trim().normalize("NFKC").toLocaleLowerCase();
  const filteredApps = useMemo(
    () => apps.filter((app) => {
      if (!normalizedQuery) return true;
      const keywords = pick(app.keywords, app.keywordsEn, preferEn);
      const text = [
        pick(app.label, app.labelEn, preferEn),
        pick(app.desc, app.descEn, preferEn),
        ...keywords,
      ].join(" ").normalize("NFKC").toLocaleLowerCase();
      return text.includes(normalizedQuery);
    }),
    [apps, normalizedQuery, preferEn],
  );

  // Close on outside click or Escape.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onDocClick = (e: MouseEvent) => {
      if (!root.contains(e.target as Node)) {
        setDropdownOpen(false);
        setLanguageOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setLanguageOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleTheme = () => {
    const fn =
      onToggleTheme ??
      (typeof window !== "undefined" &&
      (window as unknown as { ToolboxTheme?: { toggleTheme?: () => void } })
        .ToolboxTheme?.toggleTheme
        ? (window as unknown as { ToolboxTheme: { toggleTheme: () => void } })
            .ToolboxTheme.toggleTheme
        : undefined);
    fn?.();
  };

  const themeTitle = preferEn ? "Toggle theme" : "切换明暗主题";
  const langTitle = preferEn ? "Choose language" : "选择语言";
  const toolMenuTitle = preferEn ? "Open tool menu" : "打开工具菜单";
  const searchTitle = preferEn ? "Search tools" : "搜索工具";

  return (
    <header
      ref={rootRef as React.RefObject<HTMLElement>}
      className={["toolbox-nav", className].filter(Boolean).join(" ")}
      role="banner"
    >
      <div className="toolbox-nav-inner">
        {/* Left: brand + dropdown */}
        <div className={dropdownOpen ? "toolbox-nav-dropdown is-open" : "toolbox-nav-dropdown"}>
          <div className="toolbox-nav-brand-group">
            <a className="toolbox-nav-brand-link" href="/" aria-label="Toolbox — Home">
              <span className="toolbox-nav-logo" aria-hidden="true">🧰</span>
              <span className="toolbox-nav-brand-text">Toolbox</span>
            </a>
            <button
              type="button"
              className="toolbox-nav-menu-btn"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label={toolMenuTitle}
              title={toolMenuTitle}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const shouldFocusSearch = !dropdownOpen && event.detail === 0;
                setLanguageOpen(false);
                setDropdownOpen((value) => !value);
                if (shouldFocusSearch) {
                  window.requestAnimationFrame(() => searchRef.current?.focus());
                }
              }}
            >
              <span className="toolbox-nav-caret" aria-hidden="true">▾</span>
            </button>
          </div>
          <div className="toolbox-nav-dropdown-menu" role="menu">
            <label className="toolbox-nav-search">
              <span className="toolbox-nav-search-icon" aria-hidden="true">⌕</span>
              <input
                ref={searchRef}
                className="toolbox-nav-search-input"
                type="search"
                autoComplete="off"
                spellCheck={false}
                aria-label={searchTitle}
                placeholder={preferEn ? "Search tools or tasks…" : "搜索工具或用途…"}
                value={toolQuery}
                onChange={(event) => setToolQuery(event.target.value)}
              />
            </label>
            {filteredApps.map((a) => (
              <a
                key={a.id}
                href={a.href}
                role="menuitem"
                className={
                  a.id === currentApp
                    ? "toolbox-nav-dropdown-item is-active active"
                    : "toolbox-nav-dropdown-item"
                }
                onClick={() => setDropdownOpen(false)}
              >
                <span className="toolbox-nav-item-title">
                  {pick(a.label, a.labelEn, preferEn)}
                </span>
                <span className="toolbox-nav-item-desc">
                  {pick(a.desc, a.descEn, preferEn)}
                </span>
              </a>
            ))}
            {filteredApps.length === 0 ? (
              <p className="toolbox-nav-search-empty">
                {preferEn ? "No matching tools" : "没有匹配的工具"}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: actions */}
        <div className="toolbox-nav-actions">
          {rightSlot}
          <div
            className={
              languageOpen
                ? "toolbox-nav-language is-open"
                : "toolbox-nav-language"
            }
          >
            <button
              type="button"
              className="toolbox-nav-icon-btn toolbox-nav-lang"
              aria-label={langTitle}
              title={langTitle}
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDropdownOpen(false);
                setLanguageOpen((value) => !value);
              }}
            >
              <GlobeIcon />
            </button>
            <div className="toolbox-nav-language-menu" role="menu">
              {LANGUAGES.map((language) => {
                const selected = language.code === resolvedLang;
                return (
                  <button
                    type="button"
                    key={language.code}
                    role="menuitemradio"
                    aria-checked={selected}
                    data-lang={language.code}
                    lang={language.lang}
                    className={
                      selected
                        ? "toolbox-nav-language-option is-active"
                        : "toolbox-nav-language-option"
                    }
                    onClick={() => {
                      setLang(language.code);
                      setLanguageOpen(false);
                    }}
                  >
                    <span className="toolbox-nav-language-label">
                      {language.label}
                    </span>
                    <span className="toolbox-nav-language-check">
                      {selected ? <CheckIcon /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="toolbox-nav-icon-btn toolbox-nav-theme"
            aria-label={themeTitle}
            title={themeTitle}
            onClick={toggleTheme}
          >
            <span className="toolbox-nav-theme-icon toolbox-nav-theme-sun">
              <SunIcon />
            </span>
            <span className="toolbox-nav-theme-icon toolbox-nav-theme-moon">
              <MoonIcon />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default NavBar;
