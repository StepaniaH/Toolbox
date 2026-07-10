/**
 * i18n.js — Internationalisation module.
 * Central translation engine. Translation maps live in i18n-zh.js / i18n-en.js.
 * Attaches to window.I18n = { t(key, params?), setLocale(locale), getLocale(),
 *   onChange(fn), init(), refreshDOM(), translations: { zh: {}, en: {} } }.
 *
 * Must load AFTER theme.js, BEFORE any module that uses translations.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'toolbox-lang';
  var currentLocale = 'zh';

  /** Two-locale translation maps. Populated by i18n-zh.js and i18n-en.js. */
  var t9n = { zh: {}, en: {} };

  /* ------------------------------------------------------------------ */
  /* Core API                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Look up a translation key in the current locale.
   * Falls back to zh if the key is missing in the current locale.
   * Falls back to the raw key if missing entirely.
   *
   * @param {string} key    - Translation key (e.g. 'app.title').
   * @param {Object} [params] - Optional substitution map (e.g. { count: 5 }).
   *   Placeholders in the format {paramName} are replaced.
   * @returns {string} Translated string.
   */
  function t(key, params) {
    var map = t9n[currentLocale];
    var val = map[key];

    // Fallback to zh if current locale is missing this key
    if (val === undefined && currentLocale !== 'zh') {
      val = t9n.zh[key];
    }

    // Last resort: return the key itself
    if (val === undefined) return key;

    // Replace {paramName} placeholders
    if (params) {
      for (var p in params) {
        if (params.hasOwnProperty(p)) {
          val = val.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
        }
      }
    }

    return val;
  }

  /**
   * Switch locale and refresh all i18n-bound DOM elements.
   * @param {string} locale - 'zh' or 'en'.
   */
  function setLocale(locale) {
    if (locale !== 'zh' && locale !== 'en') return;
    if (locale === currentLocale) return;

    currentLocale = locale;

    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* Ignore quota / privacy errors. */
    }

    refreshDOM();
    notifyListeners();
  }

  /** @returns {string} Current locale ('zh' or 'en'). */
  function getLocale() {
    return currentLocale;
  }

  /** Read persisted locale from localStorage. */
  function getStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* DOM refresh                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Walk the DOM and update every element with i18n attributes.
   * Called on locale change and on init.
   */
  function refreshDOM() {
    document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en';

    // data-i18n → textContent (or placeholder for inputs)
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      if (!key) continue;

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t(key);
      } else if (el.tagName === 'TITLE') {
        document.title = t(key);
      } else {
        el.textContent = t(key);
      }
    }

    // data-i18n-title → title attribute
    var titleEls = document.querySelectorAll('[data-i18n-title]');
    for (var j = 0; j < titleEls.length; j++) {
      titleEls[j].title = t(titleEls[j].getAttribute('data-i18n-title'));
    }

    // data-i18n-aria → aria-label
    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < ariaEls.length; k++) {
      ariaEls[k].setAttribute('aria-label', t(ariaEls[k].getAttribute('data-i18n-aria')));
    }

    // data-tooltip-i18n → data-tooltip (for CSS tooltips)
    var tipEls = document.querySelectorAll('[data-tooltip-i18n]');
    for (var m = 0; m < tipEls.length; m++) {
      tipEls[m].setAttribute('data-tooltip', t(tipEls[m].getAttribute('data-tooltip-i18n')));
    }

    // data-i18n-html → innerHTML (use sparingly — for formatted content)
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var n = 0; n < htmlEls.length; n++) {
      htmlEls[n].innerHTML = t(htmlEls[n].getAttribute('data-i18n-html'));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Listener system (for JS modules to re-render on locale change)      */
  /* ------------------------------------------------------------------ */

  var listeners = [];

  /**
   * Register a callback to be called when locale changes.
   * @param {Function} fn - Callback receiving the new locale string.
   * @returns {Function} Unsubscribe function.
   */
  function onChange(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      listeners = listeners.filter(function (f) { return f !== fn; });
    };
  }

  function notifyListeners() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](currentLocale);
      } catch {
        /* Swallow listener errors. */
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                */
  /* ------------------------------------------------------------------ */

  function init() {
    var stored = getStored();
    if (stored === 'en' || stored === 'zh') {
      currentLocale = stored;
    }
    refreshDOM();
    notifyListeners();

    // React to language changes dispatched by the shared NavBar
    // (nav-bar.js applyLang fallback fires this when window.ToolboxI18n is absent).
    window.addEventListener('toolbox-lang-change', function (event) {
      var lang = event && event.detail && event.detail.lang;
      if (lang === 'zh' || lang === 'en') {
        setLocale(lang);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  window.I18n = {
    t: t,
    setLocale: setLocale,
    getLocale: getLocale,
    onChange: onChange,
    init: init,
    refreshDOM: refreshDOM,
    translations: t9n // populated by i18n-zh.js and i18n-en.js
  };

  // Classic-script compatibility; the Vite entry owns ordered startup.
  if (!window.__MONITOR_CHOICE_MANUAL_BOOT__) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
