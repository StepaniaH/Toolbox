// @toolbox/nav — vanilla JS navigation bar.
//
// Mounts the shared Toolbox nav into a host element with id "toolbox-nav"
// (or any element passed to mount()). Renders two slots:
//   left  → 🧰 Toolbox dropdown (hover on desktop, tap on touch) with local
//           tool search; the active tool is highlighted with `.is-active`
//   right → settings gear (language and theme live in the Settings app)
//
// Pair with `@toolbox/nav/nav-bar.css` and `@toolbox/theme` (index.css +
// toggle.js). The current app is auto-detected from `location.pathname`
// unless overridden via `mount(el, { currentApp: "rate-lens" })`.
//
// Tool identity, routes and public labels come from @toolbox/app-manifest.

import { getAppById, getStableApps } from "@toolbox/app-manifest";

(function (global) {
  "use strict";

  var TOOLS = getStableApps()
    .filter(function (app) {
      return app.presentation?.card !== false;
    })
    .map(function (app) {
    return {
      id: app.navId,
      label: app.navLabel.zh,
      labelEn: app.navLabel.en,
      href: app.path,
      desc: app.description.zh,
      descEn: app.description.en,
      keywords: app.keywords.zh,
      keywordsEn: app.keywords.en
    };
  });

  var LANG_KEY = "toolbox-lang";
  var LANG_EVENT = "toolbox-lang-change";
  var ZH = "zh";
  var ZH_HANT = "zh-Hant";
  var EN = "en";

  function isZh() {
    try {
      var saved = global.localStorage
        ? global.localStorage.getItem(LANG_KEY)
        : null;
      if (saved === ZH || saved === ZH_HANT || saved === EN) return saved !== EN;
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
      if (lang === ZH || lang === ZH_HANT || lang === EN) return lang;
    }
    return isZh() ? ZH : EN;
  }

  function pickLang(zh, zhHant, en) {
    var lang = currentLang();
    if (lang === EN) return en;
    if (lang === ZH_HANT && zhHant !== undefined && zhHant !== null) return zhHant;
    return zh;
  }

  function labelOf(tool) {
    return pickLang(tool.label, undefined, tool.labelEn);
  }

  function descOf(tool) {
    return pickLang(tool.desc, undefined, tool.descEn);
  }

  function searchTextOf(tool) {
    var terms = pickLang(tool.keywords, undefined, tool.keywordsEn);
    return [labelOf(tool), descOf(tool)].concat(terms).join(" ")
      .normalize("NFKC")
      .toLocaleLowerCase();
  }

  function normalizeQuery(value) {
    return value.trim().normalize("NFKC").toLocaleLowerCase();
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
    var brandGroup = el("div", "toolbox-nav-brand-group");
    var brandLink = link("/", "toolbox-nav-brand-link");
    brandLink.setAttribute("aria-label", "Toolbox — Home");
    brandLink.appendChild(el("span", "toolbox-nav-logo", "🧰"));
    brandLink.appendChild(el("span", "toolbox-nav-brand-text", "Toolbox"));
    brandGroup.appendChild(brandLink);
    var menuBtn = el("button", "toolbox-nav-menu-btn");
    menuBtn.type = "button";
    menuBtn.setAttribute("aria-haspopup", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.appendChild(el("span", "toolbox-nav-caret", "▾"));
    brandGroup.appendChild(menuBtn);
    dropdown.appendChild(brandGroup);

    var menu = el("div", "toolbox-nav-dropdown-menu");
    menu.setAttribute("role", "menu");
    var search = el("label", "toolbox-nav-search");
    search.appendChild(el("span", "toolbox-nav-search-icon", "⌕"));
    var searchInput = el("input", "toolbox-nav-search-input");
    searchInput.type = "search";
    searchInput.autocomplete = "off";
    searchInput.spellcheck = false;
    search.appendChild(searchInput);
    menu.appendChild(search);
    var toolItems = [];
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
      toolItems.push(item);
    }
    var noResults = el("p", "toolbox-nav-search-empty");
    noResults.hidden = true;
    menu.appendChild(noResults);
    dropdown.appendChild(menu);
    inner.appendChild(dropdown);

    // ---- Right: settings ----
    var actions = el("div", "toolbox-nav-actions");

    var settingsApp = getAppById("settings");
    if (settingsApp && settingsApp.status === "stable") {
      var settingsLink = el("a", "toolbox-nav-icon-btn toolbox-nav-settings");
      settingsLink.href = settingsApp.path;
      settingsLink.setAttribute(
        "aria-label",
        currentLang() === EN ? "Settings" : "设置"
      );
      settingsLink.setAttribute("title", settingsLink.getAttribute("aria-label"));
      settingsLink.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="3"></circle>' +
        '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' +
        "</svg>";
      actions.appendChild(settingsLink);
    }

    inner.appendChild(actions);
    nav.appendChild(inner);

    return {
      root: nav,
      dropdown: dropdown,
      brandLink: brandLink,
      menuBtn: menuBtn,
      searchInput: searchInput,
      toolItems: toolItems,
      noResults: noResults
    };
  }

  function renderToolLabels(refs) {
    var english = currentLang() === EN;
    var menuTitle = english ? "Open tool menu" : "打开工具菜单";
    refs.menuBtn.setAttribute("aria-label", menuTitle);
    refs.menuBtn.setAttribute("title", menuTitle);
    for (var i = 0; i < TOOLS.length; i++) {
      var tool = TOOLS[i];
      var desktop = refs.toolItems[i];
      if (desktop) {
        desktop.querySelector(".toolbox-nav-item-title").textContent = labelOf(tool);
        desktop.querySelector(".toolbox-nav-item-desc").textContent = descOf(tool);
      }
    }
    var english = currentLang() === EN;
    refs.searchInput.setAttribute(
      "placeholder",
      english ? "Search tools or tasks…" : "搜索工具或用途…"
    );
    refs.searchInput.setAttribute(
      "aria-label",
      english ? "Search tools" : "搜索工具"
    );
    refs.noResults.textContent = english ? "No matching tools" : "没有匹配的工具";
    applyToolFilter(refs);
  }

  function applyToolFilter(refs) {
    var query = normalizeQuery(refs.searchInput.value);
    var visible = 0;
    for (var i = 0; i < TOOLS.length; i++) {
      var matches = !query || searchTextOf(TOOLS[i]).includes(query);
      refs.toolItems[i].hidden = !matches;
      if (matches) visible += 1;
    }
    refs.noResults.hidden = visible !== 0;
  }

  // Wire up interactions for a built tree.
  function wire(refs) {
    renderToolLabels(refs);

    // The brand itself always returns home. The adjacent caret opens the tool
    // switcher for touch/keyboard; CSS still provides hover reveal on desktop.
    refs.menuBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !refs.dropdown.classList.contains("is-open");
      refs.dropdown.classList.toggle("is-open", willOpen);
      refs.menuBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (willOpen && e.detail === 0) refs.searchInput.focus();
    });

    refs.searchInput.addEventListener("input", function () {
      applyToolFilter(refs);
    });

    // Close dropdown when a menu item is chosen (touch).
    refs.dropdown.addEventListener("click", function (e) {
      if (e.target.closest(".toolbox-nav-dropdown-item")) {
        refs.dropdown.classList.remove("is-open");
        refs.menuBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Refresh the labels when the language changes elsewhere (the Settings
    // app calling setLang, or our fallback custom event).
    var onLangChange = function () {
      renderToolLabels(refs);
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

    // Close on outside click / Escape.
    document.addEventListener("click", function (e) {
      if (!refs.root.contains(e.target)) closeAll(refs);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll(refs);
    });
  }

  function closeAll(refs) {
    refs.dropdown.classList.remove("is-open");
    refs.menuBtn.setAttribute("aria-expanded", "false");
  }

  // Mount the nav into `host` (an element or selector). Options:
  //   currentApp — override auto-detected active tool id
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
    wire(refs);
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
