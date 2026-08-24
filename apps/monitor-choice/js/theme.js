/**
 * theme.js — thin adapter over the @toolbox/theme runtime.
 *
 * The shared runtime owns storage ("toolbox-theme"), the data-theme
 * attribute and persistence. This module keeps only what the app adds on
 * top: system-follow until the first explicit choice, canvas redraw
 * notifications, and the legacy header button sync. Canvas readers resolve
 * --bg-canvas / --canvas-* custom properties from css/theme.css.
 */
(function () {
  'use strict';

  var api = window.ToolboxTheme;
  var listeners = [];

  function currentTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    return attr === 'light' || attr === 'dark' ? attr : api.getTheme();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function updateButton(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题';
    }
  }

  function notifyListeners(theme) {
    listeners.forEach(function (fn) {
      try { fn(theme); } catch {}
    });
  }

  function syncFromRuntime(theme) {
    updateButton(theme);
    notifyListeners(theme);
  }

  /** Toggle, persist via the shared runtime, then notify app listeners. */
  function toggle() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    api.setTheme(next);
    syncFromRuntime(next);
    return next;
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(api.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function getCanvasBg() {
    try {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-canvas')
        .trim() || '#232634';
    } catch {
      return '#232634';
    }
  }

  function getCanvasColor(name) {
    try {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--canvas-' + name)
        .trim();
    } catch {
      return '';
    }
  }

  function onChange(fn) {
    listeners.push(fn);
    return function () {
      var idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  /** Apply the resolved theme without persisting, wire the legacy button,
      follow OS changes while the user has not made an explicit choice, and
      route shared-runtime toggles into the notification fan-out. */
  function init() {
    applyTheme(currentTheme());
    updateButton(currentTheme());

    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', toggle);
    }

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function (e) {
        if (!getStoredTheme()) {
          var next = e.matches ? 'dark' : 'light';
          applyTheme(next);
          syncFromRuntime(next);
        }
      });
  }

  // The NavBar delegates its default toggle to window.ToolboxTheme; wrap it
  // so every toggle fans out to canvas redraw listeners exactly once.
  var originalToggle = api.toggleTheme.bind(api);
  api.toggleTheme = function () {
    var next = originalToggle();
    syncFromRuntime(next);
    return next;
  };

  window.ThemeManager = {
    init: init,
    toggle: toggle,
    getStoredTheme: getStoredTheme,
    getCanvasBg: getCanvasBg,
    getCanvasColor: getCanvasColor,
    onChange: onChange
  };
})();
