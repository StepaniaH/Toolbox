/**
 * state.js — Global state manager with localStorage persistence.
 * Attaches to window.AppState. All localStorage access is wrapped in try/catch.
 */
(function () {
  'use strict';

  /** localStorage key for persisted preferences. */
  var STORAGE_KEY = 'monitor-choice-prefs-v1';

  /** Keys that are persisted to localStorage. */
  var CONFIG_KEYS = [
    'distance',
    'size',
    'resolution',
    'workPercentage',
    'mediaPercentage',
    'deskDepth'
  ];

  /** In-memory state with defaults. */
  var _data = {
    distance: 80,
    size: 32,
    resolution: { w: 3840, h: 2160 },
    workPercentage: 70,
    mediaPercentage: 30,
    deskDepth: 80
  };

  /** Listeners map: key → Set<callback>. */
  var _listeners = {};

  /**
   * Get a state value by key.
   * @param {string} key - State key.
   * @returns {*} The stored value (or undefined).
   */
  function get(key) {
    return _data[key];
  }

  /**
   * Set a state value and notify listeners.
   * @param {string} key - State key.
   * @param {*} value - New value.
   */
  function set(key, value) {
    _data[key] = value;
    _notify(key);
  }

  /**
   * Set multiple values at once. Each changed key is notified exactly once.
   * @param {Object} updates - Map of key → value.
   */
  function batch(updates) {
    var keys = Object.keys(updates);
    var notified = {};
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      _data[key] = updates[key];
      if (!notified[key]) {
        notified[key] = true;
        _notify(key);
      }
    }
  }

  /**
   * Register a listener for a specific key.
   * @param {string} key - State key to watch.
   * @param {Function} callback - Called with the new value on change.
   * @returns {Function} Unsubscribe function.
   */
  function onChange(key, callback) {
    if (!_listeners[key]) {
      _listeners[key] = new Set();
    }
    _listeners[key].add(callback);

    return function unsubscribe() {
      if (_listeners[key]) {
        _listeners[key].delete(callback);
      }
    };
  }

  /**
   * Notify all listeners for a given key.
   * @param {string} key - State key that changed.
   */
  function _notify(key) {
    var set = _listeners[key];
    if (!set) return;
    set.forEach(function (cb) {
      try {
        cb(_data[key]);
      } catch {
        /* Swallow listener errors so one bad listener doesn't break others. */
      }
    });
  }

  /**
   * Persist the 6 config fields to localStorage.
   * @returns {boolean} true on success, false on failure.
   */
  function savePreferences() {
    try {
      var toSave = {};
      for (var i = 0; i < CONFIG_KEYS.length; i++) {
        toSave[CONFIG_KEYS[i]] = _data[CONFIG_KEYS[i]];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load preferences from localStorage and batch-set them.
   * Silently ignores corrupt or missing data.
   * @returns {boolean} true if preferences were loaded, false otherwise.
   */
  function loadPreferences() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return false;

      var updates = {};
      for (var i = 0; i < CONFIG_KEYS.length; i++) {
        var key = CONFIG_KEYS[i];
        if (parsed[key] !== undefined) {
          updates[key] = parsed[key];
        }
      }
      if (Object.keys(updates).length === 0) return false;

      batch(updates);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove persisted preferences from localStorage.
   * Silently ignores errors.
   */
  function clearPreferences() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Silently ignore. */
    }
  }

  /**
   * Check whether saved preferences exist in localStorage.
   * @returns {boolean}
   */
  function hasSavedPreferences() {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  window.AppState = {
    STORAGE_KEY: STORAGE_KEY,
    get: get,
    set: set,
    batch: batch,
    onChange: onChange,
    savePreferences: savePreferences,
    loadPreferences: loadPreferences,
    clearPreferences: clearPreferences,
    hasSavedPreferences: hasSavedPreferences
  };
})();
