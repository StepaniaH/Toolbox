// @toolbox/nav — React navigation bar.
//
// Drop-in `<NavBar />` for the React + Vite apps (rate-lens, chrono-sphere,
// sane-units). Mirrors the vanilla `nav-bar.js` bar: left Toolbox dropdown
// (active tool highlighted) and right theme + language toggles (+ hamburger
// on narrow screens). The center quick-link row was removed in favor of the
// dropdown.
//
// Pair with `@toolbox/nav/nav-bar.css` and `@toolbox/theme` (index.css +
// toggle.js). The theme toggle delegates to `window.ToolboxTheme.toggleTheme`
// by default — pass `onToggleTheme` to override. `currentApp` highlights the
// matching link and should match a `NavApp["id"]` from `NAV_APPS` below.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { setLang, getLang, onChange } from "@toolbox/i18n";

export type NavApp = {
  id: string;
  label: string;
  labelEn?: string;
  href: string;
  desc: string;
  descEn?: string;
};

/** Canonical Toolbox tool list. Append new tools here (docs/AGENTS.md §五). */
export const NAV_APPS: NavApp[] = [
  {
    id: "home",
    label: "首页",
    labelEn: "Home",
    href: "/",
    desc: "Toolbox 导航中心",
    descEn: "Toolbox navigation hub",
  },
  {
    id: "rate-lens",
    label: "RateLens",
    href: "/rate-lens/",
    desc: "AI 模型价格倍率计算器",
    descEn: "AI model pricing calculator",
  },
  {
    id: "chrono-sphere",
    label: "ChronoSphere",
    href: "/chrono-sphere/",
    desc: "日期与时区工具",
    descEn: "Date & timezone utility",
  },
  {
    id: "monitor-choice",
    label: "Monitor Choice",
    href: "/monitor-choice/",
    desc: "显示器参数实验室",
    descEn: "Display parameter lab",
  },
  {
    id: "sane-units",
    label: "SaneUnits",
    href: "/sane-units/",
    desc: "单位换算与实感估算",
    descEn: "Unit conversion & estimation",
  },
];

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
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

  // Close on outside click / Escape / viewport widening.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onDocClick = (e: MouseEvent) => {
      if (!root.contains(e.target as Node)) {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    };
    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
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
    setSpinning(false);
    requestAnimationFrame(() => setSpinning(true));
  };

  const themeTitle = preferEn ? "Toggle theme" : "切换明暗主题";
  const menuLabel = preferEn ? "Menu" : "菜单";
  // Language toggle: button shows the *target* language (opposite of current).
  const targetLang = resolvedLang === "zh" ? "en" : "zh";
  const langTitle = preferEn ? "切换到中文" : "Switch to English";

  return (
    <header
      ref={rootRef as React.RefObject<HTMLElement>}
      className={["toolbox-nav", className].filter(Boolean).join(" ")}
      role="banner"
    >
      <div className="toolbox-nav-inner">
        {/* Left: brand + dropdown */}
        <div className={dropdownOpen ? "toolbox-nav-dropdown is-open" : "toolbox-nav-dropdown"}>
          <button
            type="button"
            className="toolbox-nav-brand-btn"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            aria-label="Toolbox"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileOpen(false);
              setDropdownOpen((v) => !v);
            }}
          >
            <span className="toolbox-nav-logo" aria-hidden="true">🧰</span>
            <span className="toolbox-nav-brand-text">Toolbox</span>
            <span className="toolbox-nav-caret" aria-hidden="true">▾</span>
          </button>
          <div className="toolbox-nav-dropdown-menu" role="menu">
            {apps.map((a) => (
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
          </div>
        </div>

        {/* Right: actions */}
        <div className="toolbox-nav-actions">
          {rightSlot}
          <button
            type="button"
            className="toolbox-nav-icon-btn toolbox-nav-lang"
            aria-label={langTitle}
            title={langTitle}
            onClick={() => setLang(targetLang)}
          >
            <span className="toolbox-nav-lang-flag" aria-hidden="true">
              {targetLang === "en" ? "🇬🇧" : "🇨🇳"}
            </span>
            <span className="toolbox-nav-lang-text">
              {targetLang === "en" ? "EN" : "中"}
            </span>
          </button>
          <button
            type="button"
            className={
              spinning
                ? "toolbox-nav-icon-btn toolbox-nav-theme is-animating"
                : "toolbox-nav-icon-btn toolbox-nav-theme"
            }
            aria-label={themeTitle}
            title={themeTitle}
            onClick={toggleTheme}
          >
            <span aria-hidden="true">🌓</span>
          </button>
          <button
            type="button"
            className={
              mobileOpen ? "toolbox-nav-hamburger is-open" : "toolbox-nav-hamburger"
            }
            aria-label={menuLabel}
            aria-expanded={mobileOpen}
            aria-controls="toolbox-nav-mobile"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropdownOpen(false);
              setMobileOpen((v) => !v);
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <nav
        id="toolbox-nav-mobile"
        className={mobileOpen ? "toolbox-nav-mobile is-open" : "toolbox-nav-mobile"}
        aria-label="Toolbox tools (mobile)"
        hidden={undefined}
      >
        {apps.map((a) => (
          <a
            key={a.id}
            href={a.href}
            data-app={a.id}
            className={
              a.id === currentApp
                ? "toolbox-nav-mobile-link is-active"
                : "toolbox-nav-mobile-link"
            }
            onClick={() => setMobileOpen(false)}
          >
            <span>{pick(a.label, a.labelEn, preferEn)}</span>
            <span className="toolbox-nav-mobile-desc">
              {pick(a.desc, a.descEn, preferEn)}
            </span>
          </a>
        ))}
      </nav>
    </header>
  );
}

export default NavBar;
