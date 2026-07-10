/**
 * tab-color-lab.js — Color Space Lab tab controller.
 * Attaches to window.TabColorLab = { init(), destroy() }.
 *
 * Renders the CIE 1931 xy chromaticity diagram with gamut triangles,
 * a panel comparison table, and scene gamut needs list.
 */
(function () {
  'use strict';

  var cleanups = [];
  var resizeTimer = null;
  var selectedGamut = 'srgb';

  /** Shortcut: read a canvas CSS variable. */
  function CA(name) {
    return window.ThemeManager ? ThemeManager.getCanvasColor(name) : '';
  }
  /** Return current theme's canvas background color. */
  function getCanvasBg() {
    return window.ThemeManager ? ThemeManager.getCanvasBg() : '#232634';
  }

  /* ------------------------------------------------------------------ */
  /* Gamut definitions                                                  */
  /* ------------------------------------------------------------------ */

  var GAMUTS = [
    { key: 'srgb',     name: 'sRGB',      color: '#8bd3ff' },
    { key: 'dciP3',    name: 'DCI-P3',    color: '#ffd37a' },
    { key: 'adobeRGB', name: 'Adobe RGB', color: '#8ff0b2' },
    { key: 'bt2020',   name: 'BT.2020',   color: '#b39cff' }
  ];

  var SCENE_LABELS = {
    coding: '编程开发',
    webDesign: '网页设计',
    videoEditing: '视频剪辑',
    printProofing: '印刷打样',
    hdrCreation: 'HDR 创作',
    gaming: '游戏',
    daily: '日常使用'
  };

  /* ------------------------------------------------------------------ */
  /* CIE 1931 canvas                                                    */
  /* ------------------------------------------------------------------ */

  function renderCanvas() {
    var canvas = document.getElementById('colorCanvas');
    if (!canvas) return;

    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 500;
    var cssH = canvas.clientHeight || 480;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = getCanvasBg();
    ctx.fillRect(0, 0, cssW, cssH);

    var padL = 45, padR = 20, padT = 20, padB = 40;
    var plotW = cssW - padL - padR;
    var plotH = cssH - padT - padB;
    var xMax = 0.8, yMax = 0.9;

    function toPx(x, y) {
      return {
        px: padL + (x / xMax) * plotW,
        py: cssH - padB - (y / yMax) * plotH
      };
    }

    // Grid
    ctx.strokeStyle = CA('grid');
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= xMax; gx += 0.1) {
      var gp = toPx(gx, 0);
      ctx.beginPath();
      ctx.moveTo(gp.px, padT);
      ctx.lineTo(gp.px, cssH - padB);
      ctx.stroke();
    }
    for (var gy = 0; gy <= yMax; gy += 0.1) {
      var gp2 = toPx(0, gy);
      ctx.beginPath();
      ctx.moveTo(padL, gp2.py);
      ctx.lineTo(cssW - padR, gp2.py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = CA('axis');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, cssH - padB);
    ctx.lineTo(cssW - padR, cssH - padB);
    ctx.stroke();

    ctx.fillStyle = CA('label');
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('x', cssW - padR - 5, cssH - padB + 15);
    ctx.fillText('y', padL - 15, padT + 8);

    // Tick labels
    ctx.fillStyle = CA('tick');
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (var tx = 0; tx <= xMax; tx += 0.2) {
      var tp = toPx(tx, 0);
      ctx.fillText(tx.toFixed(1), tp.px, cssH - padB + 14);
    }
    ctx.textAlign = 'right';
    for (var ty = 0; ty <= yMax; ty += 0.2) {
      var tp2 = toPx(0, ty);
      ctx.fillText(ty.toFixed(1), padL - 5, tp2.py + 3);
    }

    // Spectral locus
    var locus = Constants.CIE_1931_LOCUS;
    if (locus && locus.length > 0) {
      ctx.beginPath();
      var first = toPx(locus[0][0], locus[0][1]);
      ctx.moveTo(first.px, first.py);
      for (var i = 1; i < locus.length; i++) {
        var lp = toPx(locus[i][0], locus[i][1]);
        ctx.lineTo(lp.px, lp.py);
      }
      ctx.closePath();

      // Subtle gradient fill
      var grad = ctx.createLinearGradient(padL, cssH - padB, cssW - padR, padT);
      grad.addColorStop(0, 'rgba(40,20,60,0.45)');
      grad.addColorStop(0.3, 'rgba(20,60,60,0.35)');
      grad.addColorStop(0.6, 'rgba(60,60,20,0.3)');
      grad.addColorStop(1, 'rgba(60,20,20,0.25)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = CA('accent-border');
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Gamut triangles
    GAMUTS.forEach(function (g) {
      var coords = Constants.GAMUT_COORDINATES[g.key];
      if (!coords) return;

      var isSelected = g.key === selectedGamut;
      var r = toPx(coords.R[0], coords.R[1]);
      var gg = toPx(coords.G[0], coords.G[1]);
      var b = toPx(coords.B[0], coords.B[1]);

      // Triangle fill + outline
      ctx.beginPath();
      ctx.moveTo(r.px, r.py);
      ctx.lineTo(gg.px, gg.py);
      ctx.lineTo(b.px, b.py);
      ctx.closePath();

      ctx.fillStyle = isSelected ? g.color + '22' : CA('ghost');
      ctx.fill();
      ctx.strokeStyle = isSelected ? g.color : CA('side');
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Vertex dots
      [r, gg, b].forEach(function (pt) {
        ctx.fillStyle = isSelected ? g.color : CA('side-border');
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, isSelected ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Labels for selected gamut
      if (isSelected) {
        ctx.fillStyle = g.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('R', r.px, r.py - 6);
        ctx.fillText('G', gg.px, gg.py - 6);
        ctx.fillText('B', b.px, b.py + 14);

        // Name at centroid
        var cx = (r.px + gg.px + b.px) / 3;
        var cy = (r.py + gg.py + b.py) / 3;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(g.name, cx, cy);
      }
    });

    // D65 white point
    var d65 = toPx(0.3127, 0.3290);
    ctx.fillStyle = CA('d65-fill');
    ctx.beginPath();
    ctx.arc(d65.px, d65.py, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CA('d65-stroke');
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = CA('d65-label');
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('D65', d65.px + 5, d65.py - 4);

    ctx.textAlign = 'left';
  }

  /* ------------------------------------------------------------------ */
  /* Gamut selector                                                     */
  /* ------------------------------------------------------------------ */

  function renderGamutSelector() {
    var container = document.getElementById('gamutSelector');
    if (!container) return;

    var html = '<span class="control-label">' + I18n.t('color.gamut') + '：</span>';
    GAMUTS.forEach(function (g) {
      var cls = 'gamut-pill';
      if (g.key === selectedGamut) cls += ' active';
      html += '<button class="' + cls + '" data-gamut="' + g.key + '">' + g.name + '</button>';
    });
    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Panel comparison table                                             */
  /* ------------------------------------------------------------------ */

  function renderPanelTable() {
    var container = document.getElementById('panelTable');
    if (!container || !window.Constants || !Constants.PANEL_TYPES) return;

    var html = '<table><thead><tr>';
    html += '<th>' + I18n.t('color.table.panel') + '</th><th>' + I18n.t('color.table.contrast') + '</th><th>' + I18n.t('color.table.gamut') + '</th><th>' + I18n.t('color.table.deltaE') + '</th>';
    html += '<th>' + I18n.t('color.table.pros') + '</th><th>' + I18n.t('color.table.cons') + '</th>';
    html += '</tr></thead><tbody>';

    Constants.PANEL_TYPES.forEach(function (p) {
      var isEn = I18n.getLocale() === 'en';
      var prosArr = (isEn && p.prosEn) ? p.prosEn : (p.pros || []);
      var consArr = (isEn && p.consEn) ? p.consEn : (p.cons || []);
      html += '<tr>';
      html += '<td>' + p.name + '</td>';
      html += '<td>' + p.contrastRatio + '</td>';
      html += '<td>' + p.gamut + '</td>';
      // DeltaE badge
      var deltaENum = parseFloat(p.deltaE.replace(/[^\d.]/g, ''));
      var badgeCls = 'good';
      if (deltaENum >= 3) badgeCls = 'warn';
      if (deltaENum >= 5) badgeCls = 'bad';
      html += '<td><span class="badge ' + badgeCls + '">' + p.deltaE + '</span></td>';
      html += '<td>' + prosArr.join('；') + '</td>';
      html += '<td>' + consArr.join('；') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Gamut needs list                                                   */
  /* ------------------------------------------------------------------ */

  function renderGamutNeeds() {
    var container = document.getElementById('gamutNeeds');
    if (!container || !window.Constants || !Constants.SCENE_GAMUT_NEEDS) return;

    var html = '';
    for (var key in Constants.SCENE_GAMUT_NEEDS) {
      var req = Constants.SCENE_GAMUT_NEEDS[key];
      var label = I18n.t('color.scene.' + key) || SCENE_LABELS[key] || key;
      var reqCls = '';
      if (req.indexOf('BT.2020') !== -1) reqCls = 'max';
      else if (req.indexOf('DCI-P3') !== -1 || req.indexOf('Adobe') !== -1) reqCls = 'high';
      html += '<li><span class="use-case">' + label + '</span><span class="gamut-req ' + reqCls + '">' + req + '</span></li>';
    }
    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Main render                                                        */
  /* ------------------------------------------------------------------ */

  function render() {
    renderGamutSelector();
    renderCanvas();
    renderPanelTable();
    renderGamutNeeds();
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  function init() {
    cleanups = [];
    render();

    // Gamut selector
    var container = document.getElementById('gamutSelector');
    if (container) {
      function handleClick(e) {
        var btn = e.target.closest('.gamut-pill');
        if (!btn) return;
        selectedGamut = btn.getAttribute('data-gamut');
        render();
      }
      container.addEventListener('click', handleClick);
      cleanups.push(function () { container.removeEventListener('click', handleClick); });
    }

    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderCanvas, 150);
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

  window.TabColorLab = { init: init, destroy: destroy };
})();
