/**
 * tab-size-view.js — Size & Distance tab controller.
 * Attaches to window.TabSizeView = { init(), destroy() }.
 *
 * Renders screen dimensions, FOV, THX/SMPTE recommended distances,
 * desk constraint stats, a 2D scale comparison canvas,
 * and a draggable 3D scene canvas (pseudo-3D via Canvas 2D projection).
 */
(function () {
  'use strict';

  var cleanups = [];
  var resizeTimer = null;
  var selectedSizes = [];

  // 3D camera state
  var camRY = 0.15;   // Y-axis rotation (radians)
  var camRX = -0.15;  // X-axis pitch (radians, negative = looking down)
  var isDragging = false;
  var dragLastX = 0;
  var dragLastY = 0;

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

  function initSelectedSizes(currentSize) {
    selectedSizes = [currentSize];
    var allSizes = [24, 27, 32, 38, 42, 48, 55, 65, 75];
    var smaller = allSizes.filter(function (s) { return s < currentSize; });
    var larger = allSizes.filter(function (s) { return s > currentSize; });
    if (larger.length > 0) selectedSizes.push(larger[0]);
    if (smaller.length > 0) selectedSizes.push(smaller[smaller.length - 1]);
    while (selectedSizes.length < 3) {
      var added = false;
      for (var i = 0; i < allSizes.length; i++) {
        if (selectedSizes.indexOf(allSizes[i]) === -1) {
          selectedSizes.push(allSizes[i]);
          added = true;
          break;
        }
      }
      if (!added) break;
    }
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
  /* Stats                                                              */
  /* ------------------------------------------------------------------ */

  function renderStats(state) {
    var size = state.size;
    var ar = getAspectRatio(state.resolution.w, state.resolution.h);
    var distance = state.distance;
    var deskDepth = state.deskDepth;

    var dims = Calc.resolveDimensions(size, ar);
    var fov = Calc.computeHorizontalFOV(size, ar, distance);
    var thx = Calc.computeTHXDistance(size);
    var smpte = Calc.computeSMPTERange(size);
    var desk = Calc.computeDeskConstraint(deskDepth);

    var el;
    el = document.getElementById('size-dimensions');
    if (el) el.textContent = dims.widthCm.toFixed(1) + ' × ' + dims.heightCm.toFixed(1) + ' cm';
    el = document.getElementById('size-fov');
    if (el) el.textContent = fov.toFixed(1) + '°';
    el = document.getElementById('size-thx');
    if (el) el.textContent = Math.round(thx) + ' cm';
    el = document.getElementById('size-smpte');
    if (el) el.textContent = Math.round(smpte.min) + '-' + Math.round(smpte.max) + ' cm';

    var deskEl = document.getElementById('size-desk');
    var deskStat = document.getElementById('size-desk-stat');
    if (deskEl) deskEl.textContent = I18n.t('size.desk.usable', { usable: Math.round(desk.usableDepthCm), max: Math.round(desk.maxDiagonalInch) });
    if (deskStat) {
      deskStat.classList.remove('warn', 'bad');
      if (size > desk.maxDiagonalInch) deskStat.classList.add('bad');
      else if (size > desk.maxDiagonalInch * 0.85) deskStat.classList.add('warn');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Size selector                                                      */
  /* ------------------------------------------------------------------ */

  function renderSizeSelector(currentSize) {
    var container = document.getElementById('sizeSelector');
    if (!container) return;
    var availableSizes = [24, 27, 32, 38, 42, 48, 55, 65, 75];
    var html = '<span class="control-label">' + I18n.t('size.compareSizes') + '：</span>';
    availableSizes.forEach(function (s) {
      var cls = 'size-pill';
      if (selectedSizes.indexOf(s) !== -1) cls += ' active';
      if (s === currentSize) cls += ' current';
      html += '<button class="' + cls + '" data-size="' + s + '">' + s + '″</button>';
    });
    container.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* 2D Canvas — front view (true relative scale comparison)            */
  /* ------------------------------------------------------------------ */

  function render2DCanvas(state) {
    var canvas = document.getElementById('sizeCanvas');
    if (!canvas) return;

    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 600;
    var cssH = canvas.clientHeight || 200;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = getCanvasBg();
    ctx.fillRect(0, 0, cssW, cssH);

    var size = state.size;
    var distance = state.distance;
    var ar = getAspectRatio(state.resolution.w, state.resolution.h);

    var displaySizes = selectedSizes.slice();
    if (displaySizes.indexOf(size) === -1) displaySizes.push(size);
    displaySizes.sort(function (a, b) { return a - b; });

    var screens = displaySizes.map(function (s) {
      var dims = Calc.resolveDimensions(s, ar);
      return { size: s, widthCm: dims.widthCm, heightCm: dims.heightCm, isCurrent: s === size };
    });

    var padX = 30, padTop = 12, padBottom = 72;
    var maxW = Math.max.apply(null, screens.map(function (s) { return s.widthCm; }));
    var availW = cssW - padX * 2 - (screens.length - 1) * 20;
    var availH = cssH - padTop - padBottom;
    var scale = Math.min(availW / (maxW * screens.length), availH / maxW * (9 / 16));
    scale = Math.max(scale, 0.3);

    var baselineY = cssH - padBottom;

    ctx.strokeStyle = CA('grid');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, baselineY + 2);
    ctx.lineTo(cssW - padX, baselineY + 2);
    ctx.stroke();

    var cursorX = padX;
    screens.forEach(function (s) {
      var w = s.widthCm * scale;
      var h = s.heightCm * scale;
      var x = cursorX + (availW / screens.length - w) / 2;
      x = Math.max(cursorX, x);
      var y = baselineY - h;

      ctx.fillStyle = s.isCurrent ? CA('accent-fill') : CA('ghost');
      ctx.strokeStyle = s.isCurrent ? CA('accent') : CA('side-border');
      ctx.lineWidth = s.isCurrent ? 2.5 : 1.5;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = s.isCurrent ? CA('accent-ghost') : CA('ghost');
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

      var standW = Math.max(8, w * 0.15);
      ctx.fillStyle = s.isCurrent ? CA('accent') : CA('side-border');
      ctx.fillRect(x + w / 2 - 1, baselineY - 10, 2, 12);
      ctx.fillRect(x + w / 2 - standW / 2, baselineY - 3, standW, 3);

      ctx.fillStyle = s.isCurrent ? CA('accent') : CA('text-muted');
            ctx.font = (s.isCurrent ? 'bold 16px ' : '14px ') + 'system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(s.size + '″', x + w / 2, y - 12);

      ctx.fillStyle = s.isCurrent ? CA('accent') : CA('text-muted');
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(s.widthCm.toFixed(0) + '×' + s.heightCm.toFixed(0) + 'cm', x + w / 2, baselineY + 18);

      if (s.isCurrent) {
        ctx.fillStyle = CA('accent');
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.fillText(I18n.t('size.current'), x + w / 2, baselineY + 32);
      }
      cursorX += availW / screens.length;
    });

    // Distance bar — placed below all labels
    var barY = baselineY + 42;
    var barEndX = padX + Math.min(distance * scale * 1.5, cssW - padX * 2);
    ctx.strokeStyle = CA('highlight');
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, barY);
    ctx.lineTo(barEndX, barY);
    ctx.stroke();
    ctx.setLineDash([]);
    [padX, barEndX].forEach(function (px) {
      ctx.fillStyle = CA('highlight');
      ctx.beginPath();
      ctx.moveTo(px, barY);
      ctx.lineTo(px + (px === padX ? 6 : -6), barY - 4);
      ctx.lineTo(px + (px === padX ? 6 : -6), barY + 4);
      ctx.fill();
    });
    ctx.fillStyle = CA('highlight');
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(I18n.t('size.watchDist') + ' ' + distance + 'cm', (padX + barEndX) / 2, barY - 8);

    var fov = Calc.computeHorizontalFOV(size, ar, distance);
    ctx.fillStyle = CA('fov');
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(I18n.t('size.fovLabel') + ' ' + fov.toFixed(1) + '°', cssW - padX, 25);
    ctx.textAlign = 'left';
  }

  /* ------------------------------------------------------------------ */
  /* 3D Engine — pseudo-3D via Canvas 2D perspective projection        */
  /* ------------------------------------------------------------------ */

  // 3D point → 2D screen point
  // Coordinate system: X=right, Y=up, Z=forward (toward viewer)
  // Camera at origin, looking toward -Z
  function project3d(p, focal, centerX, centerY, ry, rx) {
    // Rotate around Y axis
    var cosY = Math.cos(ry), sinY = Math.sin(ry);
    var x1 = p.x * cosY - p.z * sinY;
    var z1 = p.x * sinY + p.z * cosY;
    var y1 = p.y;

    // Rotate around X axis
    var cosX = Math.cos(rx), sinX = Math.sin(rx);
    var y2 = y1 * cosX - z1 * sinX;
    var z2 = y1 * sinX + z1 * cosX;
    var x2 = x1;

    // Perspective projection
    var camZ = 300; // camera distance behind origin
    var depth = z2 + camZ;
    if (depth < 1) depth = 1; // clamp to avoid division by zero

    return {
      x: centerX + (focal * x2) / depth,
      y: centerY - (focal * y2) / depth,
      depth: depth
    };
  }

  // Draw a 3D quad (4 points) as a filled polygon with optional stroke
  function drawFace(ctx, pts, fillColor, strokeColor, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth || 1;
      ctx.stroke();
    }
  }

  // Draw a 3D line
  function drawLine3D(ctx, p1, p2, color, width, dash) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    if (dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function render3DScene(state) {
    var canvas = document.getElementById('scene3dCanvas');
    if (!canvas) return;

    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 600;
    var cssH = canvas.clientHeight || 400;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = getCanvasBg();
    ctx.fillRect(0, 0, cssW, cssH);

    var size = state.size;
    var distance = state.distance;
    var deskDepth = state.deskDepth;
    var ar = getAspectRatio(state.resolution.w, state.resolution.h);

    var dims = Calc.resolveDimensions(size, ar);
    var screenW = dims.widthCm;
    var screenH = dims.heightCm;

    // Scale: 1cm = scaleScale pixels in 3D space
    var scaleScale = 1.2;
    var focal = cssW * 0.9;
    var centerX = cssW / 2;
    var centerY = cssH * 0.65;

    // Scene geometry (all in cm, scaled)
    var s = scaleScale;

    // Desk: centered at origin, width=120cm, depth=deskDepth, height=75cm
    var deskW = 120 * s;
    var deskD = deskDepth * s;
    var deskTopY = 75 * s;   // desk surface height
    var deskBottomY = 0;     // floor

    // Screen: centered on desk, standing on desk surface
    var scrW = screenW * s;
    var scrH = screenH * s;
    var scrZ = -(deskDepth - 10) * s; // screen near back of desk
    var scrStandH = 15 * s;  // stand height above desk
    var scrBottomY = deskTopY + scrStandH;
    var scrTopY = scrBottomY + scrH;

    // Person: seated, 10cm from front edge of desk
    var eyeY = (75 + 45) * s; // eye height = desk height + 45cm seated torso
    var eyeZ = 10 * s;         // 10cm from desk front edge
    var eyeX = 0;

    // Convert to 3D coords (X=right, Y=up, Z=toward viewer)
    // Desk front edge at Z=0, desk back at Z=-deskD
    // Person eye at Z = eyeZ (positive = toward viewer)

    // Project helper
    function P(x, y, z) {
      return project3d({ x: x, y: y, z: z }, focal, centerX, centerY, camRY, camRX);
    }

    // === Draw floor grid ===
    var gridStep = 30 * s;
    var gridExtent = 200 * s;
    ctx.lineWidth = 1;
    for (var gz = gridExtent; gz >= -gridExtent; gz -= gridStep) {
      var opacity = 0.04 + 0.06 * (1 - Math.abs(gz) / gridExtent);
      var p1 = P(-gridExtent, 0, gz);
      var p2 = P(gridExtent, 0, gz);
      drawLine3D(ctx, p1, p2, CA('grid'), 1);
    }
    for (var gx = -gridExtent; gx <= gridExtent; gx += gridStep) {
      var opacity2 = 0.04 + 0.06 * (1 - Math.abs(gx) / gridExtent);
      var p3 = P(gx, 0, gridExtent);
      var p4 = P(gx, 0, -gridExtent);
      drawLine3D(ctx, p3, p4, CA('grid'), 1);
    }

    // === Draw desk ===
    var deskHalfW = deskW / 2;
    var deskFrontZ = 0;
    var deskBackZ = -deskD;

    // Desk top surface
    var dTL = P(-deskHalfW, deskTopY, deskBackZ);
    var dTR = P(deskHalfW, deskTopY, deskBackZ);
    var dBR = P(deskHalfW, deskTopY, deskFrontZ);
    var dBL = P(-deskHalfW, deskTopY, deskFrontZ);
    drawFace(ctx, [dTL, dTR, dBR, dBL], CA('desk-fill'), CA('desk-stroke'), 1.5);

    // Desk front face
    var dFTL = P(-deskHalfW, deskTopY, deskFrontZ);
    var dFTR = P(deskHalfW, deskTopY, deskFrontZ);
    var dFBR = P(deskHalfW, deskBottomY, deskFrontZ);
    var dFBL = P(-deskHalfW, deskBottomY, deskFrontZ);
    drawFace(ctx, [dFTL, dFTR, dFBR, dFBL], CA('desk-fill'), CA('desk-stroke'), 1);

    // === Draw monitor ===
    var scrHalfW = scrW / 2;
    var sTL = P(-scrHalfW, scrTopY, scrZ);
    var sTR = P(scrHalfW, scrTopY, scrZ);
    var sBR = P(scrHalfW, scrBottomY, scrZ);
    var sBL = P(-scrHalfW, scrBottomY, scrZ);

    // Screen back (facing viewer) — the actual display
    var isTV = size >= 42;
    var screenFill = isTV ? 'rgba(255,211,122,0.08)' : CA('accent-ghost');
    var screenStroke = isTV ? 'rgba(255,211,122,0.8)' : CA('accent');
    drawFace(ctx, [sTL, sTR, sBR, sBL], screenFill, screenStroke, 2);

    // Screen bezel effect — inner rectangle
    var bezel = 4 * s;
    var ibTL = P(-scrHalfW + bezel, scrTopY - bezel, scrZ);
    var ibTR = P(scrHalfW - bezel, scrTopY - bezel, scrZ);
    var ibBR = P(scrHalfW - bezel, scrBottomY + bezel, scrZ);
    var ibBL = P(-scrHalfW + bezel, scrBottomY + bezel, scrZ);
    drawFace(ctx, [ibTL, ibTR, ibBR, ibBL], isTV ? 'rgba(255,211,122,0.03)' : CA('accent-ghost'), null, 0);

    // Screen side (thickness)
    var scrThickness = 3 * s;
    var ssTL = P(scrHalfW, scrTopY, scrZ);
    var ssTR = P(scrHalfW, scrTopY, scrZ - scrThickness);
    var ssBR = P(scrHalfW, scrBottomY, scrZ - scrThickness);
    var ssBL = P(scrHalfW, scrBottomY, scrZ);
    drawFace(ctx, [ssTL, ssTR, ssBR, ssBL], CA('side'), CA('side-border'), 1);

    // Stand
    var standBaseY = deskTopY;
    var standTopY = scrBottomY;
    var standW = Math.max(6 * s, scrW * 0.12);
    var stBL = P(-standW / 2, standBaseY, scrZ);
    var stBR = P(standW / 2, standBaseY, scrZ);
    var stTR = P(standW / 2, standTopY, scrZ);
    var stTL = P(-standW / 2, standTopY, scrZ);
    drawFace(ctx, [stBL, stBR, stTR, stTL], CA('stand'), CA('stand-border'), 1);
    // Stand base plate
    var baseW = Math.max(15 * s, scrW * 0.2);
    var baseL = 8 * s;
    var bsFL = P(-baseW / 2, deskTopY, scrZ - baseL / 2);
    var bsFR = P(baseW / 2, deskTopY, scrZ - baseL / 2);
    var bsBR = P(baseW / 2, deskTopY, scrZ + baseL / 2);
    var bsBL = P(-baseW / 2, deskTopY, scrZ + baseL / 2);
    drawFace(ctx, [bsFL, bsFR, bsBR, bsBL], CA('stand'), CA('stand-border'), 1);

    // === Draw person (simplified silhouette) ===
    // Head
    var headR = 12 * s;
    var headY = eyeY + 5 * s;
    var headP = P(eyeX, headY, eyeZ);
    ctx.fillStyle = CA('person');
    ctx.strokeStyle = CA('person-stroke');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(headP.x, headP.y, headR * (focal / (headP.depth || 1)), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shoulders
    var shoulderW = 45 * s;
    var shoulderY = eyeY - 20 * s;
    var shL = P(eyeX - shoulderW / 2, shoulderY, eyeZ);
    var shR = P(eyeX + shoulderW / 2, shoulderY, eyeZ);
    var shBL = P(eyeX - shoulderW / 2, deskTopY, eyeZ + 10 * s);
    var shBR = P(eyeX + shoulderW / 2, deskTopY, eyeZ + 10 * s);
    drawFace(ctx, [shL, shR, shBR, shBL], CA('clothes'), CA('clothes-stroke'), 1.5);

    // === Draw FOV cone (from eye to screen edges) ===
    var eyeP = P(eyeX, eyeY, eyeZ);
    var fovTL = P(-scrHalfW, scrTopY, scrZ);
    var fovTR = P(scrHalfW, scrTopY, scrZ);
    var fovBR = P(scrHalfW, scrBottomY, scrZ);
    var fovBL = P(-scrHalfW, scrBottomY, scrZ);

    ctx.fillStyle = CA('ghost');
    ctx.strokeStyle = CA('fov');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(eyeP.x, eyeP.y);
    ctx.lineTo(fovTL.x, fovTL.y);
    ctx.lineTo(fovTR.x, fovTR.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(eyeP.x, eyeP.y);
    ctx.lineTo(fovBL.x, fovBL.y);
    ctx.lineTo(fovBR.x, fovBR.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // === Draw viewing distance line (eye to screen center) ===
    var scrCenterP = P(0, (scrTopY + scrBottomY) / 2, scrZ);
    drawLine3D(ctx, eyeP, scrCenterP, CA('highlight'), 2, [6, 4]);

    // Distance label
    var midP = P(0, (eyeY + (scrTopY + scrBottomY) / 2) / 2, (eyeZ + scrZ) / 2);
    ctx.fillStyle = CA('highlight');
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(distance + 'cm', midP.x, midP.y - 6);

    // Eye marker
    ctx.fillStyle = CA('highlight');
    ctx.beginPath();
    ctx.arc(eyeP.x, eyeP.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // === Labels ===
    // Screen size label (above screen)
    var labelP = P(0, scrTopY + 20 * s, scrZ);
    ctx.fillStyle = isTV ? '#ffd37a' : '#8bd3ff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(size + '″ ' + screenW.toFixed(0) + '×' + screenH.toFixed(0) + 'cm', labelP.x, labelP.y);

    // FOV label (top right of canvas)
    var fov = Calc.computeHorizontalFOV(size, ar, distance);
    ctx.fillStyle = 'rgba(100,200,100,0.8)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('水平视野角 ' + fov.toFixed(1) + '°', cssW - 16, 22);

    // Desk depth label
    var deskLabelP = P(0, deskTopY - 5, -deskD / 2);
    ctx.fillStyle = 'rgba(200,160,100,0.6)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('桌深 ' + deskDepth + 'cm', deskLabelP.x, deskLabelP.y);

    ctx.textAlign = 'left';
  }

  /* ------------------------------------------------------------------ */
  /* Main render                                                        */
  /* ------------------------------------------------------------------ */

  function render() {
    var distance = AppState.get('distance');
    var size = AppState.get('size');
    var resolution = AppState.get('resolution');
    var deskDepth = AppState.get('deskDepth');
    if (!resolution) return;

    var state = { distance: distance, size: size, resolution: resolution, deskDepth: deskDepth };

    if (selectedSizes.length === 0 || selectedSizes.indexOf(size) === -1) {
      initSelectedSizes(size);
    }

    renderStats(state);
    renderSizeSelector(size);
    render2DCanvas(state);
    render3DScene(state);
  }

  /* ------------------------------------------------------------------ */
  /* 3D drag interaction                                                */
  /* ------------------------------------------------------------------ */

  function setupDrag(canvas) {
    function onDown(e) {
      isDragging = true;
      var rect = canvas.getBoundingClientRect();
      dragLastX = (e.clientX || e.touches[0].clientX) - rect.left;
      dragLastY = (e.clientY || e.touches[0].clientY) - rect.top;
      e.preventDefault();
    }

    function onMove(e) {
      if (!isDragging) return;
      var rect = canvas.getBoundingClientRect();
      var x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      var y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
      var dx = x - dragLastX;
      var dy = y - dragLastY;

      camRY += dx * 0.01;
      camRX -= dy * 0.01;
      // Clamp pitch
      camRX = Math.max(-0.5, Math.min(0.5, camRX));

      dragLastX = x;
      dragLastY = y;

      var distance = AppState.get('distance');
      var size = AppState.get('size');
      var resolution = AppState.get('resolution');
      var deskDepth = AppState.get('deskDepth');
      if (resolution) {
        render3DScene({ distance: distance, size: size, resolution: resolution, deskDepth: deskDepth });
      }
      e.preventDefault();
    }

    function onUp() {
      isDragging = false;
    }

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    // Touch
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);

    return function () {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  function init() {
    cleanups = [];

    var size = AppState.get('size');
    initSelectedSizes(size);
    render();

    ['distance', 'size', 'resolution', 'deskDepth'].forEach(function (key) {
      var unsub = AppState.onChange(key, render);
      cleanups.push(unsub);
    });

    // Size selector clicks
    var container = document.getElementById('sizeSelector');
    if (container) {
      function handleClick(e) {
        var btn = e.target.closest('.size-pill');
        if (!btn) return;
        var s = parseInt(btn.getAttribute('data-size'), 10);
        if (s === AppState.get('size')) return;
        var idx = selectedSizes.indexOf(s);
        if (idx === -1) { if (selectedSizes.length < 5) selectedSizes.push(s); }
        else { if (selectedSizes.length > 1) selectedSizes.splice(idx, 1); }
        render();
      }
      container.addEventListener('click', handleClick);
      cleanups.push(function () { container.removeEventListener('click', handleClick); });
    }

    // 3D drag
    var scene3d = document.getElementById('scene3dCanvas');
    if (scene3d) {
      cleanups.push(setupDrag(scene3d));
    }

    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 150);
    }
    window.addEventListener('resize', onResize);
    cleanups.push(function () {
      window.removeEventListener('resize', onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    });

    // Re-render on language change
    cleanups.push(I18n.onChange(function () { render(); }));
  }

  function destroy() {
    cleanups.forEach(function (fn) { if (fn) fn(); });
    cleanups = [];
    isDragging = false;
  }

  window.TabSizeView = { init: init, destroy: destroy };
})();
