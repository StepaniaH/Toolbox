// @toolbox/nav — React navigation bar.
//
// Drop-in `<NavBar />` for the React + Vite apps (rate-lens, chrono-sphere,
// sane-units). Mirrors the vanilla `nav-bar.js` bar: left Toolbox dropdown
// with local tool search (the single switcher on desktop and mobile) and a
// settings gear on the right. Language and theme live in the Settings app;
// the bar intentionally offers no second entry point.
//
// Pair with `@toolbox/nav/nav-bar.css` and `@toolbox/theme` (index.css +
// toggle.js). `currentApp` highlights the matching link and should match a
// `NavApp["id"]` from `NAV_APPS` below.

import { useEffect, useMemo, useRef, useState } from "react";
import { getLang, onChange } from "@toolbox/i18n";
import { getAppById, getStableApps } from "@toolbox/app-manifest";

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export type NavApp = {
  id: string;
  label: string;
  labelEn?: string;
  labelZhHant?: string;
  href: string;
  desc: string;
  descEn?: string;
  descZhHant?: string;
  keywords: readonly string[];
  keywordsEn?: readonly string[];
  keywordsZhHant?: readonly string[];
};

/** Navigation projection of the canonical public app manifest. */
export const NAV_APPS: NavApp[] = getStableApps()
  .filter((app) => app.presentation?.card !== false)
  .map((app) => ({
  id: app.navId,
  label: app.navLabel.zh,
  labelEn: app.navLabel.en,
  labelZhHant: app.navLabel.zhHant,
  href: app.path,
  desc: app.description.zh,
  descEn: app.description.en,
  descZhHant: app.description.zhHant,
  keywords: app.keywords.zh,
  keywordsEn: app.keywords.en,
  keywordsZhHant: app.keywords.zhHant,
}));

type UiLang = "zh" | "zh-Hant" | "en";

/** Resolve the language-aware value; zh-Hant falls back to zh when absent. */
function pick<T>(zh: T, zhHant: T | undefined, en: T | undefined, lang: UiLang): T {
  if (lang === "en" && en !== undefined) return en;
  if (lang === "zh-Hant" && zhHant !== undefined) return zhHant;
  return zh;
}

export type NavBarProps = {
  /** id of the active app (matches NavApp.id). Highlights that link. */
  currentApp?: string;
  /** Override the default tool list. */
  apps?: NavApp[];
  /** Extra className on the root <header>. */
  className?: string;
};

export function NavBar({ currentApp, apps = NAV_APPS, className }: NavBarProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toolQuery, setToolQuery] = useState("");
  const [resolvedLang, setResolvedLang] = useState<UiLang>(getLang);

  // Keep in sync with the global language (setLang from Settings or any
  // other component) via the @toolbox/i18n core's onChange channel.
  useEffect(() => onChange(setResolvedLang), []);

  const uiLang = resolvedLang;
  const normalizedQuery = toolQuery.trim().normalize("NFKC").toLocaleLowerCase();
  const filteredApps = useMemo(
    () => apps.filter((app) => {
      if (!normalizedQuery) return true;
      const keywords = pick(app.keywords, app.keywordsZhHant, app.keywordsEn, uiLang);
      const text = [
        pick(app.label, app.labelZhHant, app.labelEn, uiLang),
        pick(app.desc, app.descZhHant, app.descEn, uiLang),
        ...keywords,
      ].join(" ").normalize("NFKC").toLocaleLowerCase();
      return text.includes(normalizedQuery);
    }),
    [apps, normalizedQuery, uiLang],
  );

  // Close on outside click or Escape.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onDocClick = (e: MouseEvent) => {
      if (!root.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toolMenuTitle = uiLang === "en" ? "Open tool menu" : "打开工具菜单";
  const searchTitle = uiLang === "en" ? "Search tools" : "搜索工具";

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
                placeholder={uiLang === "en" ? "Search tools or tasks…" : "搜索工具或用途…"}
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
                  {pick(a.label, a.labelZhHant, a.labelEn, uiLang)}
                </span>
                <span className="toolbox-nav-item-desc">
                  {pick(a.desc, a.descZhHant, a.descEn, uiLang)}
                </span>
              </a>
            ))}
            {filteredApps.length === 0 ? (
              <p className="toolbox-nav-search-empty">
                {uiLang === "en" ? "No matching tools" : "没有匹配的工具"}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: settings */}
        <div className="toolbox-nav-actions">
          {getAppById("settings")?.status === "stable" && (
            <a
              className="toolbox-nav-icon-btn toolbox-nav-settings"
              href={getAppById("settings")!.path}
              aria-label={uiLang === "en" ? "Settings" : "设置"}
              title={uiLang === "en" ? "Settings" : "设置"}
            >
              <GearIcon />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export default NavBar;
