/**
 * theme.js — Catppuccin theme manager.
 * Detects system preference, stores user choice, toggles instantly.
 * Attaches to window.ThemeManager = { init(), toggle(), getStoredTheme(), getCanvasBg(), getCanvasColor(), onChange() }.
 *
 * Shares the @toolbox/theme storage key ("toolbox-theme") and value space
 * ("dark" / "light") with toggle.js so both runtimes stay in sync.
 * Must load EARLY (first script in <body>) to avoid FOUC.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'toolbox-theme';
  var listeners = [];

  /** Detect system color scheme preference. */
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /** Apply theme to <html> element. */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }

  /** Read persisted theme from localStorage. */
  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  /** Persist theme to localStorage. */
  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* Ignore quota / privacy errors. */
    }
  }

  /** Toggle between dark ↔ light, persist, and notify listeners. */
  function toggle() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setStoredTheme(next);
    updateButton(next);
    notifyListeners(next);
  }

  /** Update toggle button emoji based on current theme. */
  function updateButton(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题';
    }
  }

  /** Call all registered change listeners with the new theme name. */
  function notifyListeners(theme) {
    listeners.forEach(function (fn) {
      try { fn(theme); } catch (e) {}
    });
  }

  /** Register a callback that fires on every theme change. Returns unsubscribe function. */
  function onChange(fn) {
    listeners.push(fn);
    return function () {
      var idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  /** Return current theme's canvas background color. */
  function getCanvasBg() {
    try {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-canvas')
        .trim() || '#232634';
    } catch (e) {
      return '#232634';
    }
  }

  /** Read a named CSS custom property for canvas drawing. */
  function getCanvasColor(name) {
    try {
      var val = getComputedStyle(document.documentElement)
        .getPropertyValue('--canvas-' + name)
        .trim();
      return val || '';
    } catch (e) {
      return '';
    }
  }

  /** Initialise theme on page load. */
  function init() {
    var theme = getStoredTheme() || getSystemTheme();
    applyTheme(theme);
    updateButton(theme);

    // Wire toggle button
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', toggle);
    }

    // Listen for OS-level theme changes (only matters when no user override)
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function (e) {
        if (!getStoredTheme()) {
          var newTheme = e.matches ? 'dark' : 'light';
          applyTheme(newTheme);
          updateButton(newTheme);
          notifyListeners(newTheme);
        }
      });
  }

  window.ThemeManager = {
    init: init,
    toggle: toggle,
    getStoredTheme: getStoredTheme,
    getCanvasBg: getCanvasBg,
    getCanvasColor: getCanvasColor,
    onChange: onChange
  };

  // Auto-init on DOM ready (runs before other modules)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
