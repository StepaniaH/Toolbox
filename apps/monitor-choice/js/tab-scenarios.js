/**
 * tab-scenarios.js — Scenarios reference tab controller.
 * Attaches to window.TabScenarios = { init(), destroy() }.
 *
 * Renders filter buttons and scenario cards from window.Scenarios.
 * Apply button sets AppState to recommended values and switches tab.
 */
(function () {
  'use strict';

  var cleanups = [];
  var currentFilter = 'all';

  var FILTERS = [
    { key: 'all',   labelKey: 'scenario.filter.all' },
    { key: 'work',  labelKey: 'scenario.filter.work' },
    { key: 'media', labelKey: 'scenario.filter.media' },
    { key: 'game',  labelKey: 'scenario.filter.game' },
    { key: 'mac',   labelKey: 'scenario.filter.mac' }
  ];

  var TAB_LABELS = {
    sharpness: 'tab.sharpness',
    sizeView: 'tab.sizeView',
    colorLab: 'tab.colorLab',
    scenarios: 'tab.scenarios',
    panelGuide: 'tab.panelGuide'
  };

  /* ------------------------------------------------------------------ */
  /* Filters                                                            */
  /* ------------------------------------------------------------------ */

  function renderFilters() {
    var container = document.getElementById('scenarioFilters');
    if (!container) return;

    var html = '<span class="filter-label">' + I18n.t('scenario.filter') + '：</span>';
    FILTERS.forEach(function (f) {
      var cls = 'filter-pill';
      if (f.key === currentFilter) cls += ' active';
      html += '<button class="' + cls + '" data-filter="' + f.key + '">' + I18n.t(f.labelKey) + '</button>';
    });
    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Scenario grid                                                      */
  /* ------------------------------------------------------------------ */

  function renderGrid() {
    var container = document.getElementById('scenarioGrid');
    if (!container || !window.Scenarios) return;

    var isEn = I18n.getLocale() === 'en';

    var filtered = Scenarios.filter(function (s) {
      if (currentFilter === 'all') return true;
      return s.category && s.category.indexOf(currentFilter) !== -1;
    });

    var html = '';
    filtered.forEach(function (s) {
      var metaArr = (isEn && s.metaEn) ? s.metaEn : (s.meta || []);
      var metaHtml = metaArr.map(function (m) {
        return '<div class="meta-row"><span class="meta-icon">›</span>' + m + '</div>';
      }).join('');

      var title = (isEn && s.titleEn) ? s.titleEn : s.title;
      var tag = (isEn && s.tagEn) ? s.tagEn : s.tag;
      var choice = (isEn && s.choiceEn) ? s.choiceEn : s.choice;

      var relatedHtml = '';
      if (s.relatedTabs && s.relatedTabs.length > 0) {
        var links = s.relatedTabs.map(function (tab) {
          var label = I18n.t(TAB_LABELS[tab]) || tab;
          return '<a href="#" data-tab="' + tab + '" class="related-tab-link">' + label + '</a>';
        }).join(' · ');
        relatedHtml = '<div class="related-link">' + I18n.t('scenario.related') + '：' + links + '</div>';
      }

      html +=
        '<div class="scenario-card">' +
        '<span class="tag">' + tag + '</span>' +
        '<h3>' + title + '</h3>' +
        '<div class="meta">' + metaHtml + '</div>' +
        '<div class="choice">' + choice + '</div>' +
        '<button class="apply-btn" data-scenario="' + s.id + '">' + I18n.t('scenario.apply') + '</button>' +
        relatedHtml +
        '</div>';
    });

    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Apply scenario                                                     */
  /* ------------------------------------------------------------------ */

  function applyScenario(scenarioId) {
    var scenario = Scenarios.filter(function (s) { return s.id === scenarioId; })[0];
    if (!scenario || !scenario.params) return;

    var p = scenario.params;
    var size = Math.round((p.recommendedSize.min + p.recommendedSize.max) / 2);
    var targetPpi = (p.recommendedPPI.min + p.recommendedPPI.max) / 2;

    var bestRes = null;
    var bestDiff = Infinity;
    if (window.Constants && Constants.RESOLUTIONS) {
      Constants.RESOLUTIONS.forEach(function (r) {
        var calcPpi = Calc.computePPI(r.w, r.h, size);
        var diff = Math.abs(calcPpi - targetPpi);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestRes = r;
        }
      });
    }

    var updates = { size: size };
    if (bestRes) {
      updates.resolution = { w: bestRes.w, h: bestRes.h };
    }
    AppState.batch(updates);

    if (scenario.relatedTabs && scenario.relatedTabs.length > 0) {
      if (window.switchTab) {
        window.switchTab(scenario.relatedTabs[0]);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Main render                                                        */
  /* ------------------------------------------------------------------ */

  function render() {
    renderFilters();
    renderGrid();
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  function init() {
    cleanups = [];
    render();

    // Filter buttons
    var filterContainer = document.getElementById('scenarioFilters');
    if (filterContainer) {
      function handleFilterClick(e) {
        var btn = e.target.closest('.filter-pill');
        if (!btn) return;
        currentFilter = btn.getAttribute('data-filter');
        render();
      }
      filterContainer.addEventListener('click', handleFilterClick);
      cleanups.push(function () { filterContainer.removeEventListener('click', handleFilterClick); });
    }

    // Grid clicks
    var gridContainer = document.getElementById('scenarioGrid');
    if (gridContainer) {
      function handleGridClick(e) {
        var applyBtn = e.target.closest('.apply-btn');
        if (applyBtn) {
          e.preventDefault();
          applyScenario(applyBtn.getAttribute('data-scenario'));
          return;
        }
        var tabLink = e.target.closest('.related-tab-link');
        if (tabLink) {
          e.preventDefault();
          var tab = tabLink.getAttribute('data-tab');
          if (tab && window.switchTab) window.switchTab(tab);
        }
      }
      gridContainer.addEventListener('click', handleGridClick);
      cleanups.push(function () { gridContainer.removeEventListener('click', handleGridClick); });
    }

    // Re-render on language change
    cleanups.push(I18n.onChange(function () { render(); }));
  }

  function destroy() {
    cleanups.forEach(function (fn) { if (fn) fn(); });
    cleanups = [];
  }

  window.TabScenarios = { init: init, destroy: destroy };
})();
