/**
 * tab-panel-guide.js — Panel Encyclopedia tab controller.
 * Attaches to window.TabPanelGuide = { init(), destroy() }.
 *
 * Renders an accordion of panel technologies, burn-in info,
 * refresh rate comparisons, and an interface bandwidth calculator.
 */
(function () {
  'use strict';

  var cleanups = [];

  /* ------------------------------------------------------------------ */
  /* Accordion                                                          */
  /* ------------------------------------------------------------------ */

  function renderAccordion() {
    var container = document.getElementById('panelAccordion');
    if (!container || !window.PanelGuideData || !PanelGuideData.sections) return;

    var panelTypes = (window.Constants && Constants.PANEL_TYPES) || [];
    var isEn = I18n.getLocale() === 'en';

    var html = '';
    PanelGuideData.sections.forEach(function (section) {
      var pt = panelTypes.filter(function (p) { return p.id === section.id; })[0];
      var summary = pt ? (pt.contrastRatio + ' · ' + pt.gamut) : '';
      var name = (isEn && section.nameEn) ? section.nameEn : section.name;
      var principle = (isEn && section.principleEn) ? section.principleEn : section.principle;
      var pros = (isEn && section.prosEn) ? section.prosEn : (section.pros || []);
      var cons = (isEn && section.consEn) ? section.consEn : (section.cons || []);
      var suitable = (isEn && section.suitableEn) ? section.suitableEn : (section.suitable || []);
      var unsuitable = (isEn && section.unsuitableEn) ? section.unsuitableEn : (section.unsuitable || []);

      html += '<div class="panel-accordion-item">';
      html += '<div class="panel-accordion-header" data-panel="' + section.id + '">';
      html += '<div class="header-left">';
      html += '<span class="panel-name">' + name + '</span>';
      html += '<span class="panel-summary">' + summary + '</span>';
      html += '</div>';
      html += '<span class="icon">▸</span>';
      html += '</div>';
      html += '<div class="panel-accordion-body">';

      html += '<div class="section-title">' + I18n.t('panel.section.principle') + '</div>';
      html += '<p class="description">' + principle + '</p>';

      html += '<div class="section-title">' + I18n.t('panel.section.pros') + '</div>';
      html += '<ul class="pros">';
      pros.forEach(function (p) { html += '<li>' + p + '</li>'; });
      html += '</ul>';

      html += '<div class="section-title">' + I18n.t('panel.section.cons') + '</div>';
      html += '<ul class="cons">';
      cons.forEach(function (c) { html += '<li>' + c + '</li>'; });
      html += '</ul>';

      html += '<div class="section-title">' + I18n.t('panel.section.suitable') + '</div>';
      html += '<div class="tag-row">';
      suitable.forEach(function (s) {
        html += '<span class="mini-tag suitable">' + s + '</span>';
      });
      html += '</div>';

      html += '<div class="section-title">' + I18n.t('panel.section.unsuitable') + '</div>';
      html += '<div class="tag-row">';
      unsuitable.forEach(function (u) {
        html += '<span class="mini-tag unsuitable">' + u + '</span>';
      });
      html += '</div>';

      html += '</div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Burn-in info                                                       */
  /* ------------------------------------------------------------------ */

  function renderBurnIn() {
    var container = document.getElementById('burnInInfo');
    if (!container || !window.PanelGuideData || !PanelGuideData.burnIn) return;

    var bi = PanelGuideData.burnIn;
    var isEn = I18n.getLocale() === 'en';
    var html = '';

    html += '<p class="panel-burnin-lead">' + ((isEn && bi.causesEn) ? bi.causesEn : bi.causes) + '</p>';

    var mitigation = (isEn && bi.mitigationEn) ? bi.mitigationEn : bi.mitigation;
    if (mitigation && mitigation.length > 0) {
      html += '<div class="panel-list-title">' + I18n.t('panel.burnIn.mitigation') + '</div>';
      html += '<ul class="panel-check-list">';
      mitigation.forEach(function (m) {
        html += '<li>' + m + '</li>';
      });
      html += '</ul>';
    }

    var riskFactors = (isEn && bi.riskFactorsEn) ? bi.riskFactorsEn : bi.riskFactors;
    if (riskFactors && riskFactors.length > 0) {
      html += '<div class="panel-list-title">' + I18n.t('panel.burnIn.riskFactors') + '</div>';
      html += '<ul class="panel-check-list panel-risk-list">';
      riskFactors.forEach(function (r) {
        html += '<li>' + r + '</li>';
      });
      html += '</ul>';
    }

    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Refresh rate comparison                                            */
  /* ------------------------------------------------------------------ */

  function renderRefreshRate() {
    var container = document.getElementById('refreshInfo');
    if (!container || !window.PanelGuideData || !PanelGuideData.refreshRate) return;

    var comparisons = PanelGuideData.refreshRate.comparisons || [];
    var isEn = I18n.getLocale() === 'en';
    var html = '<div class="refresh-grid">';

    comparisons.forEach(function (c) {
      var label = (isEn && c.labelEn) ? c.labelEn : c.label;
      var useCase = (isEn && c.useCaseEn) ? c.useCaseEn : c.useCase;
      html += '<div class="refresh-card">';
      html += '<div class="refresh-value">' + label + '</div>';
      html += '<div class="refresh-use">' + useCase + '</div>';
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Bandwidth calculator                                               */
  /* ------------------------------------------------------------------ */

  function computeBandwidth() {
    var wEl = document.getElementById('bwWidth');
    var hEl = document.getElementById('bwHeight');
    var rEl = document.getElementById('bwRefresh');
    var dEl = document.getElementById('bwDepth');
    if (!wEl || !hEl || !rEl || !dEl) return;

    var w = parseInt(wEl.value, 10) || 3840;
    var h = parseInt(hEl.value, 10) || 2160;
    var refresh = parseInt(rEl.value, 10) || 60;
    var depth = parseInt(dEl.value, 10) || 8;

    var bandwidth = Calc.computeInterfaceBandwidth(w, h, refresh, depth);

    var resultEl = document.getElementById('bwResult');
    if (!resultEl) return;

    var html = '<div class="result-row">';
    html += '<span class="result-label">' + I18n.t('panel.bw.required') + '</span>';
    html += '<span class="result-value highlight">' + bandwidth.toFixed(2) + ' Gbps</span>';
    html += '</div>';

    html += '<div class="result-row">';
    html += '<span class="result-label">' + I18n.t('panel.bw.mode') + '</span>';
    html += '<span class="result-value">' + w + '×' + h + ' @ ' + refresh + 'Hz · ' + depth + 'bit</span>';
    html += '</div>';

    if (window.Constants && Constants.INTERFACE_BANDWIDTH) {
      for (var key in Constants.INTERFACE_BANDWIDTH) {
        var iface = Constants.INTERFACE_BANDWIDTH[key];
        var ok = iface.rate >= bandwidth;
        html += '<div class="result-row">';
        html += '<span class="result-label">' + iface.name + '</span>';
        html += '<span class="result-value ' + (ok ? 'good' : 'bad') + '">';
        html += (ok ? '✓' : '✗') + ' ' + iface.rate.toFixed(2) + ' Gbps';
        html += '</span>';
        html += '</div>';
      }
    }

    resultEl.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Main render                                                        */
  /* ------------------------------------------------------------------ */

  function render() {
    renderAccordion();
    renderBurnIn();
    renderRefreshRate();
    computeBandwidth();
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  function init() {
    cleanups = [];
    render();

    var accordion = document.getElementById('panelAccordion');
    if (accordion) {
      function handleAccordionClick(e) {
        var header = e.target.closest('.panel-accordion-header');
        if (!header) return;
        var item = header.parentElement;
        var wasExpanded = item.classList.contains('expanded');
        accordion.querySelectorAll('.panel-accordion-item').forEach(function (it) {
          it.classList.remove('expanded');
        });
        if (!wasExpanded) {
          item.classList.add('expanded');
        }
      }
      accordion.addEventListener('click', handleAccordionClick);
      cleanups.push(function () { accordion.removeEventListener('click', handleAccordionClick); });
    }

    var bwIds = ['bwWidth', 'bwHeight', 'bwRefresh', 'bwDepth'];
    bwIds.forEach(function (id) {
      var input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', computeBandwidth);
        cleanups.push(function () { input.removeEventListener('input', computeBandwidth); });
      }
    });

    cleanups.push(I18n.onChange(function () { render(); }));
  }

  function destroy() {
    cleanups.forEach(function (fn) { if (fn) fn(); });
    cleanups = [];
  }

  window.TabPanelGuide = { init: init, destroy: destroy };
})();
