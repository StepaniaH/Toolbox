// @toolbox/nav — vanilla JS navigation bar.
//
// Mounts the shared Toolbox nav into a host element with id "toolbox-nav"
// (or any element passed to mount()). Renders two slots:
//   left  → 🧰 Toolbox dropdown (hover on desktop, tap on touch);
//           the active tool is highlighted with `.is-active` + `.active`
//   right → language menu + theme toggle (theme delegates to
//           @toolbox/theme's window.ToolboxTheme)
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
  var LANGUAGES = [
    { code: ZH, label: "中文（简体）", lang: "zh-CN" },
    { code: EN, label: "English", lang: "en" }
  ];

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
    return currentLang() === ZH ? tool.label : tool.labelEn;
  }

  function descOf(tool) {
    return currentLang() === ZH ? tool.desc : tool.descEn;
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

  function svgIcon(paths) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    for (var i = 0; i < paths.length; i++) {
      var definition = paths[i];
      var node = document.createElementNS(
        "http://www.w3.org/2000/svg",
        definition[0]
      );
      var attrs = definition[1];
      for (var key in attrs) node.setAttribute(key, attrs[key]);
      svg.appendChild(node);
    }
    return svg;
  }

  function globeIcon() {
    return svgIcon([
      ["circle", { cx: "12", cy: "12", r: "9" }],
      ["path", { d: "M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" }]
    ]);
  }

  function sunIcon() {
    return svgIcon([
      ["circle", { cx: "12", cy: "12", r: "4" }],
      ["path", { d: "M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" }]
    ]);
  }

  function moonIcon() {
    return svgIcon([
      ["path", { d: "M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" }]
    ]);
  }

  function checkIcon() {
    return svgIcon([["path", { d: "m5 12 4 4L19 6" }]]);
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

    var language = el("div", "toolbox-nav-language");
    var langBtn = el("button", "toolbox-nav-icon-btn toolbox-nav-lang");
    langBtn.type = "button";
    langBtn.setAttribute("aria-haspopup", "menu");
    langBtn.setAttribute("aria-expanded", "false");
    langBtn.appendChild(globeIcon());
    language.appendChild(langBtn);

    var languageMenu = el("div", "toolbox-nav-language-menu");
    languageMenu.setAttribute("role", "menu");
    var languageOptions = [];
    for (var j = 0; j < LANGUAGES.length; j++) {
      var languageDefinition = LANGUAGES[j];
      var option = el("button", "toolbox-nav-language-option");
      option.type = "button";
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("data-lang", languageDefinition.code);
      option.setAttribute("lang", languageDefinition.lang);
      option.appendChild(el("span", "toolbox-nav-language-label"));
      option.appendChild(el("span", "toolbox-nav-language-check"));
      languageMenu.appendChild(option);
      languageOptions.push(option);
    }
    language.appendChild(languageMenu);
    actions.appendChild(language);

    var themeBtn = el("button", "toolbox-nav-icon-btn toolbox-nav-theme");
    themeBtn.type = "button";
    var sun = el("span", "toolbox-nav-theme-icon toolbox-nav-theme-sun");
    sun.appendChild(sunIcon());
    var moon = el("span", "toolbox-nav-theme-icon toolbox-nav-theme-moon");
    moon.appendChild(moonIcon());
    themeBtn.appendChild(sun);
    themeBtn.appendChild(moon);
    actions.appendChild(themeBtn);

    inner.appendChild(actions);
    nav.appendChild(inner);

    return {
      root: nav,
      dropdown: dropdown,
      brandBtn: brandBtn,
      language: language,
      langBtn: langBtn,
      languageOptions: languageOptions,
      themeBtn: themeBtn,
    };
  }

  function closeAll(refs) {
    refs.dropdown.classList.remove("is-open");
    refs.brandBtn.setAttribute("aria-expanded", "false");
    refs.language.classList.remove("is-open");
    refs.langBtn.setAttribute("aria-expanded", "false");
  }

  function renderLanguageMenu(refs) {
    var current = currentLang();
    var title = current === ZH ? "选择语言" : "Choose language";
    refs.langBtn.setAttribute("aria-label", title);
    refs.langBtn.setAttribute("title", title);
    for (var i = 0; i < refs.languageOptions.length; i++) {
      var option = refs.languageOptions[i];
      var definition = LANGUAGES[i];
      var selected = definition.code === current;
      option.classList.toggle("is-active", selected);
      option.setAttribute("aria-checked", selected ? "true" : "false");
      option.querySelector(".toolbox-nav-language-label").textContent =
        definition.label;
      var check = option.querySelector(".toolbox-nav-language-check");
      check.replaceChildren();
      if (selected) check.appendChild(checkIcon());
    }
    var themeTitle = current === ZH ? "切换明暗主题" : "Toggle theme";
    refs.themeBtn.setAttribute("aria-label", themeTitle);
    refs.themeBtn.setAttribute("title", themeTitle);
  }

  function renderToolLabels(refs) {
    var desktopItems = refs.root.querySelectorAll(".toolbox-nav-dropdown-item");
    for (var i = 0; i < TOOLS.length; i++) {
      var tool = TOOLS[i];
      var desktop = desktopItems[i];
      if (desktop) {
        desktop.querySelector(".toolbox-nav-item-title").textContent = labelOf(tool);
        desktop.querySelector(".toolbox-nav-item-desc").textContent = descOf(tool);
      }
    }
  }

  function renderLanguage(refs) {
    renderLanguageMenu(refs);
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
      refs.language.classList.remove("is-open");
      refs.langBtn.setAttribute("aria-expanded", "false");
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

    // Language icon opens a scalable list instead of toggling a hard-coded pair.
    refs.langBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !refs.language.classList.contains("is-open");
      refs.dropdown.classList.remove("is-open");
      refs.brandBtn.setAttribute("aria-expanded", "false");
      refs.language.classList.toggle("is-open", willOpen);
      refs.langBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    refs.language.addEventListener("click", function (e) {
      var option = e.target.closest(".toolbox-nav-language-option");
      if (!option) return;
      applyLang(option.getAttribute("data-lang"));
      refs.language.classList.remove("is-open");
      refs.langBtn.setAttribute("aria-expanded", "false");
      renderLanguage(refs);
    });

    // Theme toggle — the CSS swaps the sun/moon state without emoji rotation.
    refs.themeBtn.addEventListener("click", function () {
      onToggleTheme();
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
