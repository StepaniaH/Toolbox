/**
 * tab-sharpness.js — Sharpness Lab tab controller.
 * Attaches to window.TabSharpness = { init(), destroy() }.
 *
 * Renders PPI/PPD/retina stats, a PPD quality meter, and three
 * canvas cards comparing text rendering at different PPI/PPD levels.
 */
(function () {
  'use strict';

  var cleanups = [];
  var resizeTimer = null;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function getAspectRatio(w, h) {
    if (!window.Constants || !Constants.RESOLUTIONS) return '16:9';
    for (var i = 0; i < Constants.RESOLUTIONS.length; i++) {
      var r = Constants.RESOLUTIONS[i];
      if (r.w === w && r.h === h) return r.ar;
    }
    return '16:9';
  }

  function ppdLabel(ppd) {
    var t = Calc.PPD_THRESHOLDS;
    if (ppd < t.POOR) return I18n.t('sharp.scale.poor');
    if (ppd < t.FAIR) return I18n.t('sharp.scale.fair');
    if (ppd < t.GOOD) return I18n.t('sharp.scale.good');
    if (ppd < t.EXCELLENT) return I18n.t('sharp.scale.excellent');
    return I18n.t('sharp.scale.retina');
  }

  function ppdColor(ppd) {
    var t = Calc.PPD_THRESHOLDS;
    if (ppd < t.POOR) return '#ff9aa2';
    if (ppd < t.FAIR) return '#ffd37a';
    if (ppd < t.GOOD) return '#8ff0b2';
    if (ppd < t.EXCELLENT) return CA('accent') || '#8bd3ff';
    return '#b39cff';
  }

  function findAltResolution(w, h) {
    if (!window.Constants || !Constants.RESOLUTIONS) return null;
    var all = Constants.RESOLUTIONS;
    var targets;
    if (w >= 3840) {
      targets = [{ w: 1920, h: 1080 }, { w: 2560, h: 1440 }];
    } else if (w >= 2560) {
      targets = [{ w: 1920, h: 1080 }, { w: 3840, h: 2160 }];
    } else {
      targets = [{ w: 3840, h: 2160 }, { w: 2560, h: 1440 }];
    }
    for (var i = 0; i < targets.length; i++) {
      for (var j = 0; j < all.length; j++) {
        if (all[j].w === targets[i].w && all[j].h === targets[i].h &&
            !(all[j].w === w && all[j].h === h)) {
          return all[j];
        }
      }
    }
    var best = null, bestDiff = 0;
    all.forEach(function (r) {
      if (r.w === w && r.h === h) return;
      var diff = Math.abs(r.w * r.h - w * h);
      if (diff > bestDiff) { bestDiff = diff; best = r; }
    });
    return best;
  }

  function findAltSize(currentSize) {
    var candidates = [27, 42, 48, 24, 55, 38, 65];
    for (var i = 0; i < candidates.length; i++) {
      if (Math.abs(candidates[i] - currentSize) >= 6) return candidates[i];
    }
    return currentSize === 32 ? 27 : 32;
  }

  /** Shortcut: read a canvas CSS variable. */
  function CA(name) {
    return window.ThemeManager ? ThemeManager.getCanvasColor(name) : '';
  }
  /** Return current theme's canvas background color. */
  function getCanvasBg() {
    return window.ThemeManager ? ThemeManager.getCanvasBg() : '#232634';
  }

  /* ------------------------------------------------------------------ */
  /* Config generation                                                  */
  /* ------------------------------------------------------------------ */

  function getConfigs(state) {
    var w = state.resolution.w;
    var h = state.resolution.h;
    var size = state.size;
    var distance = state.distance;

    var ppi = Calc.computePPI(w, h, size);
    var ppd = Calc.computePPD(ppi, distance);
    var retina = Calc.computeRetinaDistance(ppi);

    var configs = [{
      label: size + '″ ' + w + '×' + h,
      ppi: ppi,
      ppd: ppd,
      retina: retina,
      size: size,
      w: w,
      h: h,
      current: true
    }];

    var altRes = findAltResolution(w, h);
    if (altRes) {
      var altPpi = Calc.computePPI(altRes.w, altRes.h, size);
      configs.push({
        label: size + '″ ' + altRes.w + '×' + altRes.h,
        ppi: altPpi,
        ppd: Calc.computePPD(altPpi, distance),
        retina: Calc.computeRetinaDistance(altPpi),
        size: size,
        w: altRes.w,
        h: altRes.h,
        current: false
      });
    }

    var altSize = findAltSize(size);
    var sizePpi = Calc.computePPI(w, h, altSize);
    configs.push({
      label: altSize + '″ ' + w + '×' + h,
      ppi: sizePpi,
      ppd: Calc.computePPD(sizePpi, distance),
      retina: Calc.computeRetinaDistance(sizePpi),
      size: altSize,
      w: w,
      h: h,
      current: false
    });

    return configs;
  }

  /* ------------------------------------------------------------------ */
  /* PPD meter (canvas)                                                 */
  /* ------------------------------------------------------------------ */

  function renderPPDMeter(ppd) {
    var canvas = document.getElementById('sharp-ppd-meter');
    if (!canvas) return;

    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 300;
    var cssH = canvas.clientHeight || 12;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var t = Calc.PPD_THRESHOLDS;
    var maxPPD = 100;

    var segments = [
      { from: 0, to: t.POOR, color: '#ff9aa2' },
      { from: t.POOR, to: t.FAIR, color: '#ffd37a' },
      { from: t.FAIR, to: t.GOOD, color: '#8ff0b2' },
      { from: t.GOOD, to: t.EXCELLENT, color: CA('accent') || '#8bd3ff' },
      { from: t.EXCELLENT, to: maxPPD, color: '#b39cff' }
    ];

    segments.forEach(function (s) {
      var x1 = (s.from / maxPPD) * cssW;
      var x2 = (s.to / maxPPD) * cssW;
      ctx.fillStyle = s.color;
      ctx.fillRect(x1, 0, x2 - x1, cssH);
    });

    // Marker
    var markerX = Math.min(cssW - 2, Math.max(2, (ppd / maxPPD) * cssW));
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = CA('text');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(markerX, -2);
    ctx.lineTo(markerX, cssH + 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Retina threshold line
    var retinaX = (Calc.PPD_THRESHOLDS.RETINA / maxPPD) * cssW;
    ctx.strokeStyle = CA('grid');
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(retinaX, 0);
    ctx.lineTo(retinaX, cssH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ------------------------------------------------------------------ */
  /* Retina callout                                                     */
  /* ------------------------------------------------------------------ */

  function renderRetinaCallout(distance, retina, ppd) {
    var el = document.getElementById('sharp-retina-callout');
    if (!el) return;

    var statusKey, statusClass;
    if (ppd < Calc.PPD_THRESHOLDS.POOR) {
      statusKey = 'sharp.status.poor';
      statusClass = 'poor';
    } else if (distance < retina) {
      statusKey = 'sharp.status.below';
      statusClass = 'below';
    } else {
      statusKey = 'sharp.status.good';
      statusClass = '';
    }

    el.innerHTML = I18n.t('sharp.retinaCallout', {
      distance: distance,
      retina: Math.round(retina),
      statusClass: statusClass,
      status: I18n.t(statusKey)
    });
  }

  /* ------------------------------------------------------------------ */
  /* Comparison canvas                                                  */
  /* ------------------------------------------------------------------ */

  function renderComparisonCanvas(canvas, card, config) {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 280;
    var cssH = canvas.clientHeight || 180;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = getCanvasBg();
    ctx.fillRect(0, 0, cssW, cssH);

    if (config.current) {
      ctx.strokeStyle = CA('accent-border');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.75, 0.75, cssW - 1.5, cssH - 1.5);
    }

    var headerH = 42;
    if (card) {
      var titleEl = card.querySelector('.card-title');
      var subEl = card.querySelector('.card-subtitle');
      if (titleEl) {
        titleEl.textContent = config.label;
        if (config.current) titleEl.style.color = CA('accent');
        else titleEl.style.color = '';
      }
      if (subEl) {
        subEl.textContent = 'PPI ' + Math.round(config.ppi) + ' · PPD ' + config.ppd.toFixed(1) + ' (' + ppdLabel(config.ppd) + ')';
        subEl.style.color = config.current ? ppdColor(config.ppd) : '';
      }
    }

    var textAreaY = headerH;
    var textAreaH = cssH - headerH - 6;
    var textAreaW = cssW - 4;

    var refPPD = 90;
    var scale = Math.max(0.12, Math.min(1, config.ppd / refPPD));
    var vW = Math.max(2, Math.round(textAreaW * scale));
    var vH = Math.max(2, Math.round(textAreaH * scale));

    var off = document.createElement('canvas');
    off.width = vW;
    off.height = vH;
    var octx = off.getContext('2d');

    octx.fillStyle = getCanvasBg();
    octx.fillRect(0, 0, vW, vH);

    var fs = Math.max(6, Math.round(vH * 0.14));
    octx.fillStyle = CA('text');
    octx.font = 'bold ' + fs + 'px sans-serif';
    octx.textBaseline = 'top';
    octx.fillText(I18n.t('sharp.pixelText1'), 2, vH * 0.06);
    octx.fillText(I18n.t('sharp.pixelText2'), 2, vH * 0.28);

    octx.font = (fs * 0.7) + 'px sans-serif';
    octx.fillStyle = CA('text-muted');
    octx.fillText('The quick brown fox', 2, vH * 0.54);
    octx.fillText('jumps over the lazy dog', 2, vH * 0.72);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 2, textAreaY, textAreaW, textAreaH);
    ctx.imageSmoothingEnabled = true;
  }

  /* ------------------------------------------------------------------ */
  /* Main render                                                        */
  /* ------------------------------------------------------------------ */

  function render() {
    var distance = AppState.get('distance');
    var size = AppState.get('size');
    var resolution = AppState.get('resolution');
    if (!resolution) return;

    var w = resolution.w;
    var h = resolution.h;

    var ppi = Calc.computePPI(w, h, size);
    var ppd = Calc.computePPD(ppi, distance);
    var retina = Calc.computeRetinaDistance(ppi);

    var el;
    el = document.getElementById('sharp-ppi');    if (el) el.textContent = Math.round(ppi);
    el = document.getElementById('sharp-ppd');
    if (el) { el.textContent = ppd.toFixed(1); el.style.color = ppdColor(ppd); }
    el = document.getElementById('sharp-retina'); if (el) el.textContent = Math.round(retina) + ' cm';

    renderPPDMeter(ppd);
    renderRetinaCallout(distance, retina, ppd);

    var configs = getConfigs({ distance: distance, size: size, resolution: resolution });
    for (var i = 0; i < 3; i++) {
      var canvas = document.getElementById('sharp-canvas-' + i);
      var card = document.getElementById('sharp-card-' + i);
      if (canvas && configs[i]) {
        renderComparisonCanvas(canvas, card, configs[i]);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  function init() {
    cleanups = [];
    render();

    var unsubDistance = AppState.onChange('distance', render);
    var unsubSize = AppState.onChange('size', render);
    var unsubRes = AppState.onChange('resolution', render);
    cleanups.push(unsubDistance, unsubSize, unsubRes);

    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 150);
    }
    window.addEventListener('resize', onResize);
    cleanups.push(function () {
      window.removeEventListener('resize', onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    });

    // Re-render on theme change
    if (window.ThemeManager) {
      cleanups.push(ThemeManager.onChange(function () { render(); }));
    }
    // Re-render on language change
    cleanups.push(I18n.onChange(function () { render(); }));
  }

  function destroy() {
    cleanups.forEach(function (fn) { if (fn) fn(); });
    cleanups = [];
  }

  window.TabSharpness = { init: init, destroy: destroy };
})();
