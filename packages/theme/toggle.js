// @toolbox/theme — runtime theme toggle.
//
// STORAGE_KEY: "toolbox-theme"
// Resolution order when reading the current theme:
//   1. localStorage("toolbox-theme")
//   2. system `prefers-color-scheme` (dark by default)
// The chosen value is mirrored onto <html data-theme="…"> so the CSS
// variables in index.css resolve to the matching Catppuccin palette.
//
// Apps should also embed the inline pre-paint script from `prePaintScript()`
// in their index.html <head> to avoid a flash of the wrong theme.

(function (global) {
  "use strict";

  var STORAGE_KEY = "toolbox-theme";
  var FAMILY_STORAGE_KEY = "toolbox-theme-family";
  var FAMILY_ATTRIBUTE = "data-theme-family";
  var DEFAULT_FAMILY = "catppuccin";
  var FAMILIES = ["catppuccin", "gruvbox", "solarized"];
  var CONTRACT_VERSION = 2;
  var ROOT = "documentElement";
  var ATTRIBUTE = "data-theme";
  var DARK = "dark";
  var LIGHT = "light";
  var THEMES = Object.freeze([DARK, LIGHT]);

  function root() {
    return global.document ? global.document[ROOT] : null;
  }

  function prefersLight() {
    return (
      global.matchMedia &&
      global.matchMedia("(prefers-color-scheme: light)").matches
    );
  }

  function isValid(value) {
    return value === DARK || value === LIGHT;
  }

  // Read the stored choice, falling back to the system preference, then
  // to dark (Catppuccin Frappé is the Toolbox default).
  function getTheme() {
    try {
      var stored = global.localStorage
        ? global.localStorage.getItem(STORAGE_KEY)
        : null;
      if (isValid(stored)) return stored;
    } catch {
      // localStorage may be unavailable (private mode / SSR); ignore.
    }
    return prefersLight() ? LIGHT : DARK;
  }

  // Persist + apply a theme. `theme` must be "dark" or "light".
  function setTheme(theme) {
    if (!isValid(theme)) {
      throw new Error('setTheme: expected "dark" or "light", got ' + theme);
    }
    try {
      if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore persistence failures */
    }
    var el = root();
    if (el) el.setAttribute(ATTRIBUTE, theme);
    return theme;
  }

  // Flip between dark and light based on the *current* DOM attribute
  // (falls back to getTheme() when the attribute is missing/invalid).
  function toggleTheme() {
    var current = root() && root().getAttribute(ATTRIBUTE);
    if (!isValid(current)) current = getTheme();
    return setTheme(current === DARK ? LIGHT : DARK);
  }

  function isValidFamily(value) {
    return FAMILIES.indexOf(value) !== -1;
  }

  function getThemeFamily() {
    try {
      var stored = global.localStorage
        ? global.localStorage.getItem(FAMILY_STORAGE_KEY)
        : null;
      if (isValidFamily(stored)) return stored;
    } catch {
      // localStorage may be unavailable; ignore.
    }
    return DEFAULT_FAMILY;
  }

  function setThemeFamily(family) {
    if (!isValidFamily(family)) {
      throw new Error("setThemeFamily: unexpected family " + family);
    }
    try {
      if (global.localStorage) global.localStorage.setItem(FAMILY_STORAGE_KEY, family);
    } catch {
      /* ignore persistence failures */
    }
    var el = root();
    if (el) el.setAttribute(FAMILY_ATTRIBUTE, family);
    return family;
  }

  // Inline snippet for an app's <head> — applies the stored theme and
  // palette family before first paint to prevent a flash. Returns the JS as
  // a string so it can be injected into a server-rendered HTML template.
  function prePaintScript() {
    return [
      "(function(){try{",
      "var k=" + JSON.stringify(STORAGE_KEY) + ",t=localStorage.getItem(k);",
      "if(t!=='light'&&t!=='dark'){",
      "t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';",
      "}",
      "document.documentElement.setAttribute('" + ATTRIBUTE + "',t);",
      "var f=localStorage.getItem(" + JSON.stringify(FAMILY_STORAGE_KEY) + ");",
      "if(f!=='gruvbox'&&f!=='solarized'){f='" + DEFAULT_FAMILY + "';}",
      "document.documentElement.setAttribute('" + FAMILY_ATTRIBUTE + "',f);",
      "}catch(e){document.documentElement.setAttribute('" + ATTRIBUTE + "','dark');document.documentElement.setAttribute('" + FAMILY_ATTRIBUTE + "','" + DEFAULT_FAMILY + "');}",
      "})();"
    ].join("");
  }

  var api = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    STORAGE_KEY: STORAGE_KEY,
    ATTRIBUTE: ATTRIBUTE,
    DEFAULT_THEME: DARK,
    THEMES: THEMES,
    FAMILY_STORAGE_KEY: FAMILY_STORAGE_KEY,
    FAMILY_ATTRIBUTE: FAMILY_ATTRIBUTE,
    DEFAULT_THEME_FAMILY: DEFAULT_FAMILY,
    THEME_FAMILIES: Object.freeze(FAMILIES.slice()),
    getTheme: getTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    getThemeFamily: getThemeFamily,
    setThemeFamily: setThemeFamily,
    prePaintScript: prePaintScript
  };

  // UMD-ish export: attach to global && CommonJS module, no AMD needed.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (global) global.ToolboxTheme = api;
})(typeof window !== "undefined" ? window : this);
