/**
 * script.js — Entry point.
 * Populates UI, binds controls to AppState, manages tab switching.
 */
(function () {
  'use strict';

  /** Map tab data-tab attribute → window module name. */
  var TAB_MODULES = {
    sharpness: 'TabSharpness',
    sizeView: 'TabSizeView',
    colorLab: 'TabColorLab',
    scenarios: 'TabScenarios',
    panelGuide: 'TabPanelGuide'
  };

  var currentTab = null;

  /* ------------------------------------------------------------------ */
  /* Tab switching                                                      */
  /* ------------------------------------------------------------------ */

  function getTabModule(tabName) {
    var moduleName = TAB_MODULES[tabName];
    return moduleName ? window[moduleName] : null;
  }

  function switchTab(tabName) {
    if (!TAB_MODULES[tabName]) return;
    if (currentTab === tabName) return;

    // Destroy old tab
    if (currentTab) {
      var oldModule = getTabModule(currentTab);
      if (oldModule && typeof oldModule.destroy === 'function') {
        oldModule.destroy();
      }
      document.querySelectorAll('.tab-nav-btn[data-tab="' + currentTab + '"]').forEach(function (btn) {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.tab-content[data-tab="' + currentTab + '"]').forEach(function (sec) {
        sec.classList.remove('active');
      });
    }

    currentTab = tabName;

    // Activate new tab
    document.querySelectorAll('.tab-nav-btn[data-tab="' + tabName + '"]').forEach(function (btn) {
      btn.classList.add('active');
    });
    document.querySelectorAll('.tab-content[data-tab="' + tabName + '"]').forEach(function (sec) {
      sec.classList.add('active');
    });

    // Init new tab module
    var newModule = getTabModule(tabName);
    if (newModule && typeof newModule.init === 'function') {
      newModule.init();
    }
  }

  // Expose for scenario "apply" button
  window.switchTab = switchTab;

  /* ------------------------------------------------------------------ */
  /* Resolution select                                                  */
  /* ------------------------------------------------------------------ */

  function populateResolutions() {
    var select = document.getElementById('resolutionSelect');
    if (!select || !window.Constants || !Constants.RESOLUTIONS) return;

    select.innerHTML = '';
    Constants.RESOLUTIONS.forEach(function (res) {
      var opt = document.createElement('option');
      opt.value = JSON.stringify({ w: res.w, h: res.h });
      opt.textContent = res.label;
      select.appendChild(opt);
    });

    // Default to 3840×2160
    var defaultRes = Constants.RESOLUTIONS.filter(function (r) {
      return r.w === 3840 && r.h === 2160;
    })[0];
    if (defaultRes) {
      select.value = JSON.stringify({ w: defaultRes.w, h: defaultRes.h });
      AppState.set('resolution', { w: defaultRes.w, h: defaultRes.h });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Sync UI from AppState                                              */
  /* ------------------------------------------------------------------ */

  function syncUIFromState() {
    var distance = AppState.get('distance');
    var size = AppState.get('size');
    var resolution = AppState.get('resolution');
    var deskDepth = AppState.get('deskDepth');
    var workPct = AppState.get('workPercentage');
    var mediaPct = AppState.get('mediaPercentage');

    var el;

    el = document.getElementById('distanceRange');  if (el) el.value = distance;
    el = document.getElementById('distanceValue');  if (el) el.textContent = distance;

    el = document.getElementById('sizeRange');      if (el) el.value = size;
    el = document.getElementById('sizeValue');      if (el) el.textContent = size;

    el = document.getElementById('resolutionSelect');
    if (el && resolution) {
      el.value = JSON.stringify({ w: resolution.w, h: resolution.h });
    }

    el = document.getElementById('deskDepthRange'); if (el) el.value = deskDepth;
    el = document.getElementById('deskDepthValue'); if (el) el.textContent = deskDepth;

    el = document.getElementById('workRange');      if (el) el.value = workPct;
    el = document.getElementById('workValue');      if (el) el.textContent = workPct;

    el = document.getElementById('mediaRange');     if (el) el.value = mediaPct;
    el = document.getElementById('mediaValue');     if (el) el.textContent = mediaPct;
  }

  /* ------------------------------------------------------------------ */
  /* Bind controls                                                      */
  /* ------------------------------------------------------------------ */

  function bindControls() {
    // Distance slider
    var distanceRange = document.getElementById('distanceRange');
    if (distanceRange) {
      distanceRange.addEventListener('input', function () {
        var val = parseInt(this.value, 10);
        var disp = document.getElementById('distanceValue');
        if (disp) disp.textContent = val;
        AppState.set('distance', val);
      });
    }

    // Size slider
    var sizeRange = document.getElementById('sizeRange');
    if (sizeRange) {
      sizeRange.addEventListener('input', function () {
        var val = parseInt(this.value, 10);
        var disp = document.getElementById('sizeValue');
        if (disp) disp.textContent = val;
        AppState.set('size', val);
      });
    }

    // Resolution select
    var resSelect = document.getElementById('resolutionSelect');
    if (resSelect) {
      resSelect.addEventListener('change', function () {
        try {
          var parsed = JSON.parse(this.value);
          AppState.set('resolution', parsed);
        } catch (e) { /* ignore */ }
      });
    }

    // Desk depth slider
    var deskRange = document.getElementById('deskDepthRange');
    if (deskRange) {
      deskRange.addEventListener('input', function () {
        var val = parseInt(this.value, 10);
        var disp = document.getElementById('deskDepthValue');
        if (disp) disp.textContent = val;
        AppState.set('deskDepth', val);
      });
    }

    // Work percentage
    var workRange = document.getElementById('workRange');
    if (workRange) {
      workRange.addEventListener('input', function () {
        var val = parseInt(this.value, 10);
        var disp = document.getElementById('workValue');
        if (disp) disp.textContent = val;
        AppState.set('workPercentage', val);
      });
    }

    // Media percentage
    var mediaRange = document.getElementById('mediaRange');
    if (mediaRange) {
      mediaRange.addEventListener('input', function () {
        var val = parseInt(this.value, 10);
        var disp = document.getElementById('mediaValue');
        if (disp) disp.textContent = val;
        AppState.set('mediaPercentage', val);
      });
    }

    // Tab nav buttons
    document.querySelectorAll('.tab-nav-btn[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(this.getAttribute('data-tab'));
      });
    });

    // More params toggle
    var moreToggle = document.getElementById('moreParamsToggle');
    var moreParams = document.getElementById('moreParams');
    if (moreToggle && moreParams) {
      moreToggle.addEventListener('click', function () {
        var isExpanded = moreParams.classList.toggle('expanded');
        moreToggle.textContent = isExpanded ? I18n.t('input.lessParams') : I18n.t('input.moreParams');
      });
    }

    // Save button
    var saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        AppState.savePreferences();
        var original = saveBtn.textContent;
        saveBtn.textContent = I18n.t('input.saved');
        saveBtn.disabled = true;
        setTimeout(function () {
          saveBtn.textContent = original;
          saveBtn.disabled = false;
        }, 1500);
      });
    }

    // Clear button
    var clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        AppState.clearPreferences();
        var original = clearBtn.textContent;
        clearBtn.textContent = I18n.t('input.cleared');
        clearBtn.disabled = true;
        setTimeout(function () {
          clearBtn.textContent = original;
          clearBtn.disabled = false;
        }, 1500);
      });
    }

    // Lang toggle UI lives in the shared NavBar now; the page-level
    // #langToggle button has been removed. No page-side wiring needed.
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  function init() {
    populateResolutions();

    if (AppState.hasSavedPreferences()) {
      AppState.loadPreferences();
    }

    syncUIFromState();
    bindControls();
    switchTab('sharpness');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
