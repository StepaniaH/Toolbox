/**
 * i18n-zh.js — Chinese (simplified) translation map.
 * This is the canonical source locale. All keys are defined here first.
 */
(function () {
  'use strict';
  var zh = window.I18n.translations.zh;

  /* ── App header ── */
  zh['app.title'] = '显示器参数实验室';
  zh['app.subtitle'] = '理解每个参数的意义，做出自己的选择';
  zh['app.logo.label'] = '显示器';

  /* ── Input panel ── */
  zh['input.distance'] = '观看距离';
  zh['input.size'] = '屏幕尺寸';
  zh['input.resolution'] = '分辨率';
  zh['input.deskDepth'] = '桌深';
  zh['input.moreParams'] = '更多参数';
  zh['input.lessParams'] = '收起参数';
  zh['input.workPct'] = '工作占比';
  zh['input.mediaPct'] = '影音占比';
  zh['input.save'] = '记住设置';
  zh['input.saved'] = '已记住 ✓';
  zh['input.clear'] = '清除数据';
  zh['input.cleared'] = '已清除 ✓';
  zh['input.storageHint'] = '数据保存在本地浏览器';

  /* ── Units ── */
  zh['unit.cm'] = 'cm';
  zh['unit.inch'] = '″';
  zh['unit.pct'] = '%';
  zh['unit.gbps'] = 'Gbps';
  zh['unit.hz'] = 'Hz';

  /* ── Tab names ── */
  zh['tab.sharpness'] = '清晰度实验室';
  zh['tab.sizeView'] = '尺寸与距离';
  zh['tab.colorLab'] = '色彩空间';
  zh['tab.scenarios'] = '场景参考';
  zh['tab.panelGuide'] = '面板百科';

  /* ── Sharpness tab ── */
  zh['sharp.ppi'] = 'PPI';
  zh['sharp.ppi.label'] = '像素密度';
  zh['sharp.ppd'] = 'PPD';
  zh['sharp.ppd.label'] = '每度像素';
  zh['sharp.retina'] = '视网膜距离';
  zh['sharp.quality'] = '清晰度等级';
  zh['sharp.target'] = '目标 PPD ≥ 60';
  zh['sharp.retinaCallout'] = '当前观看距离 <b>{distance}cm</b>，视网膜距离 <b>{retina}cm</b>。<span class="retina-status {statusClass}">{status}。</span>';
  zh['sharp.status.poor'] = '文字明显发虚，建议提高分辨率或拉远距离';
  zh['sharp.status.below'] = '低于视网膜距离，可能看到像素颗粒';
  zh['sharp.status.good'] = '已达到视网膜级别，文字清晰锐利';
  zh['sharp.pixelText1'] = '敏捷的棕色狐狸';
  zh['sharp.pixelText2'] = '跳过了那只懒狗';

  /* ── PPD scale ── */
  zh['sharp.scale.poor'] = '差';
  zh['sharp.scale.fair'] = '一般';
  zh['sharp.scale.good'] = '良好';
  zh['sharp.scale.excellent'] = '优秀';
  zh['sharp.scale.retina'] = '视网膜';
  zh['canvas.sharpMeter'] = 'PPD 清晰度等级仪表';
  zh['canvas.sharpComparison'] = '不同尺寸与分辨率的文字清晰度对比';
  zh['canvas.scene3d'] = '屏幕尺寸、观看距离与桌面的三维关系图';
  zh['canvas.sizeComparison'] = '不同屏幕尺寸的真实比例对比';
  zh['canvas.colorSpace'] = 'CIE 1931 色域与显示器原色范围图';
  zh['canvas.fallback'] = '交互式可视化，页面同时提供文字结果。';

  /* ── Text comfort ── */
  zh['comfort.poor'] = '差';
  zh['comfort.fair'] = '一般';
  zh['comfort.good'] = '良好';
  zh['comfort.excellent'] = '优秀';
  zh['comfort.max'] = '极致';

  /* ── Size/View tab ── */
  zh['size.dimensions'] = '屏幕尺寸';
  zh['size.fov'] = '水平视野角';
  zh['size.thx'] = 'THX 推荐距离';
  zh['size.smpte'] = 'SMPTE 推荐范围';
  zh['size.desk'] = '桌深限制';
  zh['size.current'] = '当前';
  zh['size.watchDist'] = '观看距离';
  zh['size.fovLabel'] = '水平视野角';
  zh['size.3d.title'] = '3D 实景模拟';
  zh['size.3d.hint'] = '拖拽旋转视角';
  zh['size.3d.dragHint'] = '🖱️ 拖拽旋转 · 上下限制±30°';
  zh['size.compare.title'] = '屏幕比例对比';
  zh['size.compare.hint'] = '真实尺寸比例';
  zh['size.compareSizes'] = '对比尺寸';
  zh['size.desk.usable'] = '可用 {usable}cm / 最大 {max}″';
  zh['size.legend.current'] = '当前尺寸';
  zh['size.legend.compare'] = '对比尺寸';
  zh['size.legend.distance'] = '观看距离';
  zh['size.legend.fov'] = '视野范围';

  /* ── Color Lab tab ── */
  zh['color.gamut'] = '色域';
  zh['color.cieTitle'] = 'CIE 1931 色度图';
  zh['color.panelCompare'] = '面板色彩对比';
  zh['color.sceneNeeds'] = '场景色域需求';
  zh['color.table.panel'] = '面板';
  zh['color.table.contrast'] = '对比度';
  zh['color.table.gamut'] = '色域';
  zh['color.table.deltaE'] = '色准 ΔE';
  zh['color.table.pros'] = '优势';
  zh['color.table.cons'] = '不足';

  /* ── Color scene labels ── */
  zh['color.scene.coding'] = '编程开发';
  zh['color.scene.webDesign'] = '网页设计';
  zh['color.scene.videoEditing'] = '视频剪辑';
  zh['color.scene.printProofing'] = '印刷打样';
  zh['color.scene.hdrCreation'] = 'HDR 创作';
  zh['color.scene.gaming'] = '游戏';
  zh['color.scene.daily'] = '日常使用';

  /* ── Scenarios tab ── */
  zh['scenario.filter'] = '筛选';
  zh['scenario.filter.all'] = '全部';
  zh['scenario.filter.work'] = '开发办公';
  zh['scenario.filter.media'] = '影音';
  zh['scenario.filter.game'] = '游戏';
  zh['scenario.filter.mac'] = 'Mac 适配';
  zh['scenario.apply'] = '应用此场景';
  zh['scenario.related'] = '相关';

  /* ── Panel Guide tab ── */
  zh['panel.burnIn.title'] = '残影与烧屏';
  zh['panel.burnIn.mitigation'] = '缓解方法';
  zh['panel.burnIn.riskFactors'] = '风险因素';
  zh['panel.refresh.title'] = '刷新率对比';
  zh['panel.bw.title'] = '接口带宽计算器';
  zh['panel.bw.desc'] = '输入目标分辨率、刷新率和色深，计算所需带宽并查看哪些接口可以支持。';
  zh['panel.bw.width'] = '分辨率宽 (px)';
  zh['panel.bw.height'] = '分辨率高 (px)';
  zh['panel.bw.refresh'] = '刷新率 (Hz)';
  zh['panel.bw.depth'] = '色深 (bit)';
  zh['panel.bw.required'] = '所需带宽';
  zh['panel.bw.mode'] = '信号模式';
  zh['panel.section.principle'] = '原理';
  zh['panel.section.pros'] = '优势';
  zh['panel.section.cons'] = '不足';
  zh['panel.section.suitable'] = '适合场景';
  zh['panel.section.unsuitable'] = '不适合场景';

  /* ── Footer ── */
  zh['footer.privacy'] = '所有数据在本地浏览器中计算处理，不上传任何信息，不使用第三方追踪。';
  zh['footer.hosting'] = '自托管静态站点';

  /* ── Theme ── */
  zh['theme.toggle'] = '切换明暗主题';
  zh['theme.toLight'] = '切换到亮色主题';
  zh['theme.toDark'] = '切换到暗色主题';

  /* ── Language ── */
  zh['lang.toggle'] = 'English';
  zh['lang.switchTo'] = '切换语言';

  /* ── Tooltips ── */
  zh['tooltip.ppi'] = 'Pixels Per Inch：每英寸像素数，衡量屏幕像素密度。数值越高画面越细腻。';
  zh['tooltip.ppd'] = 'Pixels Per Degree：每度视角像素数，衡量人眼实际感知的清晰度。≥60 即达到 Apple Retina 标准，肉眼无法分辨单个像素。';
  zh['tooltip.retina'] = '超过此距离后，人眼无法分辨单个像素，达到 Retina 清晰度标准。距离越近越清晰。';
  zh['tooltip.dimensions'] = '屏幕对角线对应的物理宽度和高度，基于宽高比计算。';
  zh['tooltip.fov'] = '水平视野角：在当前观看距离下，屏幕水平方向覆盖的人眼视野范围。30°-40° 适合桌面工作，40°-60° 适合影音沉浸。';
  zh['tooltip.thx'] = 'THX 认证推荐距离：对角线尺寸 ÷ 0.84，产生约 40° 的水平视野角，是沉浸式观影的参考标准。';
  zh['tooltip.smpte'] = 'SMPTE（电影电视工程师协会）推荐距离范围，对应约 30°-45° 的水平视野角，是混合使用的参考区间。';
  zh['tooltip.desk'] = '基于桌深计算的物理约束：可用深度 = 桌深 - 25cm（10cm 人眼到桌沿 + 15cm 支架），推算最大可用屏幕对角线。';
  zh['tooltip.cie'] = 'CIE 1931 色度图：国际照明委员会定义的标准色度图，展示了人眼可见的所有颜色。三角形的三个顶点代表显示器三原色（红绿蓝）在色度坐标中的位置，三角形面积越大，显示器能显示的颜色范围越广。';
  zh['tooltip.gamutNeeds'] = '不同使用场景对色域覆盖的要求不同。例如编程仅需 sRGB 100%，而 HDR 创作需要 BT.2020 70%+。选择面板时应确保其覆盖你的场景需求。';

  /* ── Misc ── */
  zh['status.ok'] = '✓';
  zh['status.fail'] = '✗';
})();
