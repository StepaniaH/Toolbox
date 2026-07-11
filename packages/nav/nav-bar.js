// @toolbox/nav — vanilla JS navigation bar.
//
// Mounts the shared Toolbox nav into a host element with id "toolbox-nav"
// (or any element passed to mount()). Renders two slots:
//   left  → 🧰 Toolbox dropdown (hover on desktop, tap on touch);
//           the active tool is highlighted with `.is-active` + `.active`
//   right → theme + language toggles (theme delegates to @toolbox/theme's
//           window.ToolboxTheme) + hamburger (narrow screens only)
//
// Pair with `@toolbox/nav/nav-bar.css` and `@toolbox/theme` (index.css +
// toggle.js). The current app is auto-detected from `location.pathname`
// unless overridden via `mount(el, { currentApp: "rate-lens" })`.
//
// Tool identity, routes and public labels come from @toolbox/app-manifest.

import { getStableApps } from "@toolbox/app-manifest";

(function (global) {
  "use strict";

  var TOOLS = getStableApps().map(function (app) {
    return {
      id: app.navId,
      label: app.navLabel.zh,
      labelEn: app.navLabel.en,
      href: app.path,
      desc: app.description.zh,
      descEn: app.description.en
    };
  });

  var LANG_KEY = "toolbox-lang";
  var LANG_EVENT = "toolbox-lang-change";
  var ZH = "zh";
  var EN = "en";

  function isZh() {
    try {
      var saved = global.localStorage
        ? global.localStorage.getItem(LANG_KEY)
        : null;
      if (saved === ZH || saved === EN) return saved === ZH;
    } catch {
      /* ignore */
    }
    return (
      global.navigator &&
      typeof navigator.language === "string" &&
      navigator.language.toLowerCase().indexOf("zh") === 0
    );
  }

  // Read the active language. Prefers the shared @toolbox/i18n core when it
  // has registered itself on window.ToolboxI18n; otherwise falls back to the
  // localStorage value that both the core and the nav bar share.
  function currentLang() {
    if (global.ToolboxI18n && typeof global.ToolboxI18n.getLang === "function") {
      var lang = global.ToolboxI18n.getLang();
      if (lang === ZH || lang === EN) return lang;
    }
    return isZh() ? ZH : EN;
  }

  // Switch the active language. When @toolbox/i18n is present, delegate to its
  // setLang (it persists + broadcasts via its own onChange). Otherwise apply a
  // temporary local fallback: write localStorage and dispatch a custom
  // "toolbox-lang-change" event so other scripts can react.
  function applyLang(lang) {
    if (lang !== ZH && lang !== EN) return;
    if (
      global.ToolboxI18n &&
      typeof global.ToolboxI18n.setLang === "function"
    ) {
      global.ToolboxI18n.setLang(lang);
      return;
    }
    try {
      if (global.localStorage) global.localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore persistence failures */
    }
    if (typeof global.CustomEvent === "function" && global.dispatchEvent) {
      global.dispatchEvent(
        new global.CustomEvent(LANG_EVENT, { detail: { lang: lang } })
      );
    }
  }

  function labelOf(tool) {
    return isZh() ? tool.label : tool.labelEn;
  }

  function descOf(tool) {
    return isZh() ? tool.desc : tool.descEn;
  }

  // Pick the active tool id from the URL path. Matches a tool when its
  // href (minus trailing slash) is a path prefix of the current pathname.
  function detectCurrent(pathname) {
    var path = pathname || (global.location ? global.location.pathname : "/");
    if (!path) return "home";
    var norm = path.replace(/\/+$/, "") || "/";
    var best = "home";
    var bestLen = 0;
    for (var i = 0; i < TOOLS.length; i++) {
      var href = TOOLS[i].href.replace(/\/+$/, "") || "/";
      if (href === "/" ) {
        if (norm === "/") return TOOLS[i].id;
        continue;
      }
      if (norm === href || norm.indexOf(href + "/") === 0) {
        if (href.length > bestLen) {
          best = TOOLS[i].id;
          bestLen = href.length;
        }
      }
    }
    return best;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function link(href, cls, text) {
    var a = el("a", cls, text);
    a.setAttribute("href", href);
    return a;
  }

  // Build the full nav DOM tree. `current` is the active tool id.
  function build(current) {
    var nav = el("header", "toolbox-nav");
    nav.setAttribute("role", "banner");
    var inner = el("div", "toolbox-nav-inner");

    // ---- Left: brand + dropdown ----
    var dropdown = el("div", "toolbox-nav-dropdown");
    var brandBtn = el("button", "toolbox-nav-brand-btn");
    brandBtn.type = "button";
    brandBtn.setAttribute("aria-haspopup", "true");
    brandBtn.setAttribute("aria-expanded", "false");
    brandBtn.setAttribute("aria-label", "Toolbox");
    brandBtn.appendChild(el("span", "toolbox-nav-logo", "🧰"));
    brandBtn.appendChild(el("span", "toolbox-nav-brand-text", "Toolbox"));
    brandBtn.appendChild(el("span", "toolbox-nav-caret", "▾"));
    dropdown.appendChild(brandBtn);

    var menu = el("div", "toolbox-nav-dropdown-menu");
    menu.setAttribute("role", "menu");
    for (var i = 0; i < TOOLS.length; i++) {
      var t = TOOLS[i];
      var item = link(t.href, "toolbox-nav-dropdown-item");
      item.setAttribute("role", "menuitem");
      if (t.id === current) {
        item.classList.add("is-active");
        item.classList.add("active");
      }
      item.appendChild(el("span", "toolbox-nav-item-title", labelOf(t)));
      item.appendChild(el("span", "toolbox-nav-item-desc", descOf(t)));
      menu.appendChild(item);
    }
    dropdown.appendChild(menu);
    inner.appendChild(dropdown);

    // ---- Right: actions ----
    var actions = el("div", "toolbox-nav-actions");

    var langBtn = el("button", "toolbox-nav-icon-btn toolbox-nav-lang");
    langBtn.type = "button";
    var langFlag = el("span", "toolbox-nav-lang-flag");
    var langText = el("span", "toolbox-nav-lang-text");
    langBtn.appendChild(langFlag);
    langBtn.appendChild(langText);
    actions.appendChild(langBtn);

    var themeBtn = el("button", "toolbox-nav-icon-btn toolbox-nav-theme");
    themeBtn.type = "button";
    themeBtn.setAttribute("aria-label", "切换明暗主题");
    themeBtn.setAttribute("title", "切换明暗主题");
    themeBtn.textContent = "🌓";
    actions.appendChild(themeBtn);

    var burger = el("button", "toolbox-nav-hamburger");
    burger.type = "button";
    burger.setAttribute("aria-label", "菜单");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-controls", "toolbox-nav-mobile");
    burger.appendChild(el("span", null, ""));
    burger.appendChild(el("span", null, ""));
    burger.appendChild(el("span", null, ""));
    actions.appendChild(burger);

    inner.appendChild(actions);
    nav.appendChild(inner);

    // ---- Mobile drawer (all tools) ----
    var mobile = el("nav", "toolbox-nav-mobile");
    mobile.id = "toolbox-nav-mobile";
    mobile.setAttribute("aria-label", "Toolbox tools (mobile)");
    for (var k = 0; k < TOOLS.length; k++) {
      var m = TOOLS[k];
      var ml = link(m.href, "toolbox-nav-mobile-link");
      ml.setAttribute("data-app", m.id);
      if (m.id === current) ml.classList.add("is-active");
      ml.appendChild(el("span", null, labelOf(m)));
      ml.appendChild(el("span", "toolbox-nav-mobile-desc", descOf(m)));
      mobile.appendChild(ml);
    }
    nav.appendChild(mobile);

    return {
      root: nav,
      dropdown: dropdown,
      brandBtn: brandBtn,
      langBtn: langBtn,
      langFlag: langFlag,
      langText: langText,
      themeBtn: themeBtn,
      burger: burger,
      mobile: mobile
    };
  }

  function closeAll(refs) {
    refs.dropdown.classList.remove("is-open");
    refs.brandBtn.setAttribute("aria-expanded", "false");
    refs.burger.classList.remove("is-open");
    refs.burger.setAttribute("aria-expanded", "false");
    refs.mobile.classList.remove("is-open");
  }

  // Paint the language button to reflect the *target* language (the one a
  // click will switch to): 🇬🇧 EN when current is zh, 🇨🇳 中 when current is en.
  function renderLangButton(refs) {
    var current = currentLang();
    var target = current === ZH ? EN : ZH;
    refs.langFlag.textContent = target === EN ? "🇬🇧" : "🇨🇳";
    refs.langText.textContent = target === EN ? "EN" : "中";
    var title =
      current === ZH ? "Switch to English" : "切换到中文";
    refs.langBtn.setAttribute("aria-label", title);
    refs.langBtn.setAttribute("title", title);
  }

  function renderToolLabels(refs) {
    var desktopItems = refs.root.querySelectorAll(".toolbox-nav-dropdown-item");
    var mobileItems = refs.root.querySelectorAll(".toolbox-nav-mobile-link");
    for (var i = 0; i < TOOLS.length; i++) {
      var tool = TOOLS[i];
      var desktop = desktopItems[i];
      var mobile = mobileItems[i];
      if (desktop) {
        desktop.querySelector(".toolbox-nav-item-title").textContent = labelOf(tool);
        desktop.querySelector(".toolbox-nav-item-desc").textContent = descOf(tool);
      }
      if (mobile) {
        mobile.children[0].textContent = labelOf(tool);
        mobile.querySelector(".toolbox-nav-mobile-desc").textContent = descOf(tool);
      }
    }
  }

  function renderLanguage(refs) {
    renderLangButton(refs);
    renderToolLabels(refs);
  }

  // Wire up interactions for a built tree.
  function wire(refs, options) {
    renderLanguage(refs);

    var onToggleTheme = options && typeof options.onToggleTheme === "function"
      ? options.onToggleTheme
      : function () {
          if (global.ToolboxTheme && typeof global.ToolboxTheme.toggleTheme === "function") {
            global.ToolboxTheme.toggleTheme();
          }
        };

    // Brand dropdown: click toggles (works for both touch and mouse);
    // CSS handles hover-reveal on desktop. Click also closes on outside tap.
    refs.brandBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !refs.dropdown.classList.contains("is-open");
      // Close the mobile drawer if open — the dropdown is its own surface.
      refs.mobile.classList.remove("is-open");
      refs.burger.classList.remove("is-open");
      refs.burger.setAttribute("aria-expanded", "false");
      refs.dropdown.classList.toggle("is-open", willOpen);
      refs.brandBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    // Close dropdown when a menu item is chosen (touch) or on outside click.
    refs.dropdown.addEventListener("click", function (e) {
      if (e.target.closest(".toolbox-nav-dropdown-item")) {
        refs.dropdown.classList.remove("is-open");
        refs.brandBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Hamburger toggles the mobile drawer.
    refs.burger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !refs.mobile.classList.contains("is-open");
      refs.dropdown.classList.remove("is-open");
      refs.brandBtn.setAttribute("aria-expanded", "false");
      refs.burger.classList.toggle("is-open", willOpen);
      refs.burger.setAttribute("aria-expanded", willOpen ? "true" : "false");
      refs.mobile.classList.toggle("is-open", willOpen);
    });

    // Theme toggle — delegate to @toolbox/theme with a little spin animation.
    refs.themeBtn.addEventListener("click", function () {
      onToggleTheme();
      refs.themeBtn.classList.remove("is-animating");
      void refs.themeBtn.offsetWidth; // restart animation
      refs.themeBtn.classList.add("is-animating");
    });

    // Language toggle — flip the global language and refresh the button.
    // The shared @toolbox/i18n core (if present) handles persistence + its own
    // onChange broadcast; otherwise applyLang dispatches "toolbox-lang-change"
    // so other scripts can react.
    refs.langBtn.addEventListener("click", function () {
      var next = currentLang() === ZH ? EN : ZH;
      applyLang(next);
      renderLanguage(refs);
    });

    // Refresh the button when the language changes elsewhere (another script
    // calling setLang, or our own fallback custom event).
    var onLangChange = function () {
      renderLanguage(refs);
    };
    if (
      global.ToolboxI18n &&
      typeof global.ToolboxI18n.onChange === "function"
    ) {
      // onChange returns an unsubscribe fn; we keep it for the bar's lifetime.
      global.ToolboxI18n.onChange(onLangChange);
    }
    if (global.addEventListener) {
      global.addEventListener(LANG_EVENT, onLangChange);
    }

    // Close everything on outside click / Escape.
    document.addEventListener("click", function (e) {
      if (!refs.root.contains(e.target)) closeAll(refs);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll(refs);
    });

    // Close on viewport widening past the hamburger breakpoint.
    global.addEventListener("resize", function () {
      if (global.innerWidth > 768) closeAll(refs);
    });
  }

  // Mount the nav into `host` (an element or selector). Options:
  //   currentApp    — override auto-detected active tool id
  //   onToggleTheme — override the default theme-toggle handler
  function mount(host, options) {
    var node =
      typeof host === "string"
        ? document.querySelector(host)
        : host;
    if (!node) {
      throw new Error("@toolbox/nav: mount target not found (" + host + ")");
    }
    var current =
      options && options.currentApp
        ? options.currentApp
        : detectCurrent();
    var refs = build(current);
    wire(refs, options || {});
    node.appendChild(refs.root);
    return refs;
  }

  // Auto-mount on DOMContentLoaded if a #toolbox-nav host exists and no
  // explicit mount() has been called yet.
  function autoMount() {
    if (document.getElementById("toolbox-nav")) {
      mount("#toolbox-nav");
    }
  }

  if (
    document.readyState === "loading" &&
    typeof document.addEventListener === "function"
  ) {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }

  var api = {
    TOOLS: TOOLS,
    mount: mount,
    detectCurrent: detectCurrent
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (global) global.ToolboxNav = api;
})(typeof window !== "undefined" ? window : this);
