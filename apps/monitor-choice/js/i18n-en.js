/**
 * i18n-en.js — English translation map.
 * Only keys that differ from zh need to be defined.
 * Missing keys fall back to zh (the canonical source locale).
 */
(function () {
  'use strict';
  var en = window.I18n.translations.en;

  /* ── App header ── */
  en['app.title'] = 'Monitor Choice';
  en['app.subtitle'] = 'Understand what each parameter means and make your own choice';

  /* ── Input panel ── */
  en['input.distance'] = 'Viewing Distance';
  en['input.size'] = 'Screen Size';
  en['input.resolution'] = 'Resolution';
  en['input.deskDepth'] = 'Desk Depth';
  en['input.moreParams'] = 'More';
  en['input.lessParams'] = 'Less';
  en['input.workPct'] = 'Work %';
  en['input.mediaPct'] = 'Media %';
  en['input.save'] = 'Save';
  en['input.saved'] = 'Saved ✓';
  en['input.clear'] = 'Clear';
  en['input.cleared'] = 'Cleared ✓';
  en['input.storageHint'] = 'Data stored in your browser';

  /* ── Tab names ── */
  en['tab.sharpness'] = 'Sharpness Lab';
  en['tab.sizeView'] = 'Size & Distance';
  en['tab.colorLab'] = 'Color Space';
  en['tab.scenarios'] = 'Scenarios';
  en['tab.panelGuide'] = 'Panel Guide';

  /* ── Sharpness tab ── */
  en['sharp.ppi'] = 'PPI';
  en['sharp.ppi.label'] = 'Pixel Density';
  en['sharp.ppd'] = 'PPD';
  en['sharp.ppd.label'] = 'Pixels Per Degree';
  en['sharp.retina'] = 'Retina Distance';
  en['sharp.quality'] = 'Clarity Level';
  en['sharp.target'] = 'Target PPD ≥ 60';
  en['sharp.retinaCallout'] = 'Current distance <b>{distance}cm</b>, retina distance <b>{retina}cm</b>. <span class="retina-status {statusClass}">{status}.</span>';
  en['sharp.status.poor'] = 'Text appears blurry — increase resolution or distance';
  en['sharp.status.below'] = 'Below retina distance, pixels may be visible';
  en['sharp.status.good'] = 'Retina-level clarity, text is sharp';

  /* ── PPD scale ── */
  en['sharp.scale.poor'] = 'Poor';
  en['sharp.scale.fair'] = 'Fair';
  en['sharp.scale.good'] = 'Good';
  en['sharp.scale.excellent'] = 'Excellent';
  en['sharp.scale.retina'] = 'Retina';
  en['canvas.sharpMeter'] = 'PPD clarity level meter';
  en['canvas.sharpComparison'] = 'Text sharpness comparison across display sizes and resolutions';
  en['canvas.scene3d'] = '3D relationship between screen size, viewing distance, and desk';
  en['canvas.sizeComparison'] = 'True-scale comparison of different screen sizes';
  en['canvas.colorSpace'] = 'CIE 1931 gamut and display primary coverage diagram';
  en['canvas.fallback'] = 'Interactive visualization with equivalent text results on the page.';

  /* ── Text comfort ── */
  en['comfort.poor'] = 'Poor';
  en['comfort.fair'] = 'Fair';
  en['comfort.good'] = 'Good';
  en['comfort.excellent'] = 'Excellent';
  en['comfort.max'] = 'Superb';

  /* ── Size/View tab ── */
  en['size.dimensions'] = 'Screen Size';
  en['size.fov'] = 'Horizontal FOV';
  en['size.thx'] = 'THX Recommended';
  en['size.smpte'] = 'SMPTE Range';
  en['size.desk'] = 'Desk Limit';
  en['size.current'] = 'Current';
  en['size.watchDist'] = 'Viewing Distance';
  en['size.fovLabel'] = 'Horizontal FOV';
  en['size.3d.title'] = '3D Scene Preview';
  en['size.3d.hint'] = 'Drag to rotate';
  en['size.3d.dragHint'] = '🖱️ Drag to rotate · ±30° pitch limit';
  en['size.compare.title'] = 'Size Comparison';
  en['size.compare.hint'] = 'True scale';
  en['size.compareSizes'] = 'Compare Sizes';
  en['size.desk.usable'] = 'Usable {usable}cm / Max {max}″';
  en['size.legend.current'] = 'Current Size';
  en['size.legend.compare'] = 'Compare Size';
  en['size.legend.distance'] = 'Viewing Distance';
  en['size.legend.fov'] = 'Field of View';

  /* ── Color Lab tab ── */
  en['color.gamut'] = 'Gamut';
  en['color.cieTitle'] = 'CIE 1931 Chromaticity Diagram';
  en['color.panelCompare'] = 'Panel Color Comparison';
  en['color.sceneNeeds'] = 'Scene Gamut Requirements';
  en['color.table.panel'] = 'Panel';
  en['color.table.contrast'] = 'Contrast';
  en['color.table.gamut'] = 'Gamut';
  en['color.table.deltaE'] = 'ΔE';
  en['color.table.pros'] = 'Pros';
  en['color.table.cons'] = 'Cons';

  /* ── Color scene labels ── */
  en['color.scene.coding'] = 'Coding';
  en['color.scene.webDesign'] = 'Web Design';
  en['color.scene.videoEditing'] = 'Video Editing';
  en['color.scene.printProofing'] = 'Print Proofing';
  en['color.scene.hdrCreation'] = 'HDR Creation';
  en['color.scene.gaming'] = 'Gaming';
  en['color.scene.daily'] = 'Daily Use';

  /* ── Scenarios tab ── */
  en['scenario.filter'] = 'Filter';
  en['scenario.filter.all'] = 'All';
  en['scenario.filter.work'] = 'Office';
  en['scenario.filter.media'] = 'Media';
  en['scenario.filter.game'] = 'Gaming';
  en['scenario.filter.mac'] = 'Mac';
  en['scenario.apply'] = 'Apply';
  en['scenario.related'] = 'Related';

  /* ── Panel Guide tab ── */
  en['panel.burnIn.title'] = 'Burn-in & Image Retention';
  en['panel.burnIn.mitigation'] = 'Mitigation';
  en['panel.burnIn.riskFactors'] = 'Risk Factors';
  en['panel.refresh.title'] = 'Refresh Rate Comparison';
  en['panel.bw.title'] = 'Interface Bandwidth Calculator';
  en['panel.bw.desc'] = 'Enter target resolution, refresh rate and color depth to calculate required bandwidth and check interface compatibility.';
  en['panel.bw.width'] = 'Width (px)';
  en['panel.bw.height'] = 'Height (px)';
  en['panel.bw.refresh'] = 'Refresh Rate (Hz)';
  en['panel.bw.depth'] = 'Color Depth (bit)';
  en['panel.bw.required'] = 'Required Bandwidth';
  en['panel.bw.mode'] = 'Signal Mode';
  en['panel.section.principle'] = 'How It Works';
  en['panel.section.pros'] = 'Advantages';
  en['panel.section.cons'] = 'Drawbacks';
  en['panel.section.suitable'] = 'Ideal For';
  en['panel.section.unsuitable'] = 'Not Ideal For';

  /* ── Footer ── */
  en['footer.privacy'] = 'All data is processed locally in your browser. Nothing is uploaded, no third-party tracking.';
  en['footer.hosting'] = 'Self-hosted static site';

  /* ── Theme ── */
  en['theme.toggle'] = 'Toggle theme';
  en['theme.toLight'] = 'Switch to light theme';
  en['theme.toDark'] = 'Switch to dark theme';

  /* ── Language ── */
  en['lang.toggle'] = '中文';
  en['lang.switchTo'] = 'Switch Language';

  /* ── Tooltips ── */
  en['tooltip.ppi'] = 'Pixels Per Inch — measures pixel density of the display. Higher values mean sharper images.';
  en['tooltip.ppd'] = 'Pixels Per Degree — measures perceived sharpness by the human eye. ≥60 meets Apple Retina standard; individual pixels become indistinguishable.';
  en['tooltip.retina'] = 'Beyond this distance, the human eye cannot distinguish individual pixels, achieving Retina-level clarity. Closer = sharper.';
  en['tooltip.dimensions'] = 'Physical width and height of the display based on diagonal size and aspect ratio.';
  en['tooltip.fov'] = 'Horizontal Field of View — the angular width the screen covers in your vision. 30°–40° suits desktop work; 40°–60° suits immersive media.';
  en['tooltip.thx'] = 'THX certified recommended distance: diagonal ÷ 0.84, producing approximately 40° horizontal FOV — a reference standard for immersive viewing.';
  en['tooltip.smpte'] = 'SMPTE (Society of Motion Picture and Television Engineers) recommended distance range, corresponding to ~30°–45° horizontal FOV for mixed-use viewing.';
  en['tooltip.desk'] = 'Physical constraint based on desk depth: usable depth = desk depth − 25cm (10cm eye to edge + 15cm stand), estimates maximum usable diagonal.';
  en['tooltip.cie'] = 'CIE 1931 Chromaticity Diagram — defined by the International Commission on Illumination, showing all colors visible to the human eye. Triangle vertices represent display primaries (RGB) in chromaticity coordinates; larger triangle area = wider color gamut.';
  en['tooltip.gamutNeeds'] = 'Different use cases require different gamut coverage. For example, programming only needs sRGB 100%, while HDR creation requires BT.2020 70%+. Choose a panel that covers your use case needs.';

  /* ── Misc ── */
  en['status.ok'] = '✓';
  en['status.fail'] = '✗';
})();
