/**
 * data-panels.js — Panel technology encyclopedia data.
 * Attaches to window.PanelGuideData.
 */
(function () {
  'use strict';

  var PanelGuideData = {
    sections: [
      {
        id: 'ips',
        name: 'IPS',
        nameEn: 'IPS',
        principle: '液晶分子在通电时沿屏幕平面方向旋转排列，通过控制光线的透过方向来显示不同颜色。是目前最主流的桌面显示器面板技术。',
        principleEn: 'Liquid crystal molecules rotate in-plane when energized, controlling light transmission to display colors. The most mainstream desktop monitor panel technology.',
        pros: [
          '色彩还原准确，ΔE < 2',
          '可视角度大（178°）',
          '适合专业修图和设计',
          '响应速度适中'
        ],
        prosEn: [
          'Accurate color reproduction, ΔE < 2',
          'Wide viewing angles (178°)',
          'Ideal for professional photo/design work',
          'Decent response times'
        ],
        cons: [
          '原生对比度一般（1000:1）',
          '存在 IPS Glow 暗角现象',
          '黑色表现不如 VA/OLED',
          '高端型号价格较高'
        ],
        consEn: [
          'Modest native contrast (1000:1)',
          'IPS Glow in dark corners',
          'Black levels weaker than VA/OLED',
          'High-end models are expensive'
        ],
        suitable: ['修图与设计', '日常办公', '编程开发', '轻度影音'],
        suitableEn: ['Photo & design', 'Office work', 'Programming', 'Casual media'],
        unsuitable: ['HDR 影音体验', '暗室环境使用', '专业电竞'],
        unsuitableEn: ['HDR cinema experience', 'Dark-room use', 'Competitive gaming']
      },
      {
        id: 'va',
        name: 'VA',
        nameEn: 'VA',
        principle: '液晶分子在未通电时垂直排列阻挡光线，通电时倾斜排列允许光线通过，实现更高的原生对比度。',
        principleEn: 'Liquid crystal molecules align vertically when off (blocking light) and tilt when energized (allowing light through), achieving higher native contrast ratios.',
        pros: [
          '原生对比度高（3000:1~6000:1）',
          '黑色表现深邃',
          '无 IPS Glow',
          '性价比高'
        ],
        prosEn: [
          'High native contrast (3000:1~6000:1)',
          'Deep, rich blacks',
          'No IPS Glow',
          'Great value for money'
        ],
        cons: [
          '可视角度不如 IPS',
          '响应时间可能偏慢',
          '暗部细节过渡可能不均匀',
          '曲面型号可能变形'
        ],
        consEn: [
          'Viewing angles worse than IPS',
          'Slower response times possible',
          'Uneven dark detail transitions',
          'Curved models may distort'
        ],
        suitable: ['影音娱乐', 'HDR 内容', '日常办公', '预算有限场景'],
        suitableEn: ['Movies & entertainment', 'HDR content', 'Office work', 'Budget-conscious use'],
        unsuitable: ['专业色彩工作', '高速竞技游戏', '多角度观看'],
        unsuitableEn: ['Professional color work', 'High-speed competitive gaming', 'Multi-angle viewing']
      },
      {
        id: 'tn',
        name: 'TN',
        nameEn: 'TN',
        principle: '液晶分子在通电时扭曲排列控制光线通过，是最早的 LCD 技术结构简单、响应极快。',
        principleEn: 'Liquid crystal molecules twist when energized to control light. The earliest LCD technology — simple structure, extremely fast response.',
        pros: [
          '响应时间极快（1ms）',
          '刷新率可达 360Hz+',
          '成本低',
          '功耗低'
        ],
        prosEn: [
          'Ultra-fast response (1ms)',
          'Refresh rates up to 360Hz+',
          'Low cost',
          'Low power consumption'
        ],
        cons: [
          '色彩表现差',
          '可视角度小',
          '对比度低',
          '色彩失真明显'
        ],
        consEn: [
          'Poor color reproduction',
          'Narrow viewing angles',
          'Low contrast ratio',
          'Noticeable color shift'
        ],
        suitable: ['专业电竞', '预算极度有限', '需要极高刷新率'],
        suitableEn: ['Competitive esports', 'Extreme budget constraints', 'Max refresh rate needed'],
        unsuitable: ['修图设计', '影音娱乐', '日常使用', '多角度展示'],
        unsuitableEn: ['Photo & design', 'Movies & entertainment', 'Daily use', 'Multi-angle display']
      },
      {
        id: 'oled',
        name: 'OLED',
        nameEn: 'OLED',
        principle: '每个像素自发光，无需背光层。通过控制每个有机发光二极管的亮度实现像素级控光。',
        principleEn: 'Each pixel is self-emissive — no backlight needed. Pixel-level light control by individually driving organic light-emitting diodes.',
        pros: [
          '无限对比度',
          '像素级控光，完美黑色',
          '响应时间极快（0.1ms）',
          '色彩鲜艳，色域广'
        ],
        prosEn: [
          'Infinite contrast ratio',
          'Per-pixel lighting, perfect blacks',
          'Ultra-fast response (0.1ms)',
          'Vivid colors, wide gamut'
        ],
        cons: [
          '烧屏/残影风险',
          '亮度不如 Mini-LED',
          '全屏白场亮度有限',
          '价格昂贵'
        ],
        consEn: [
          'Burn-in / image retention risk',
          'Brightness lower than Mini-LED',
          'Limited full-screen white brightness',
          'Expensive'
        ],
        suitable: ['HDR 影音', '单机游戏', '专业设计', '暗室使用'],
        suitableEn: ['HDR movies & media', 'Single-player gaming', 'Professional design', 'Dark-room use'],
        unsuitable: ['固定 UI 长时间显示', '超亮环境', '预算有限'],
        unsuitableEn: ['Static UI for long periods', 'Very bright environments', 'Budget-limited']
      },
      {
        id: 'mini-led',
        name: 'Mini-LED',
        nameEn: 'Mini-LED',
        principle: '使用数千个微型 LED 作为背光，配合局部调光技术（Local Dimming），在 LCD 面板上实现接近 OLED 的控光效果。',
        principleEn: 'Uses thousands of tiny LEDs as backlight with local dimming zones, achieving near-OLED light control on an LCD panel.',
        pros: [
          '亮度高（1000~2000+ nits）',
          '局部调光分区多',
          'HDR 表现优秀',
          '无烧屏风险'
        ],
        prosEn: [
          'High brightness (1000~2000+ nits)',
          'Many local dimming zones',
          'Excellent HDR performance',
          'No burn-in risk'
        ],
        cons: [
          '光晕效应（blooming）',
          '对比度不及 OLED',
          '成本较高',
          '分区不够精细时仍有漏光'
        ],
        consEn: [
          'Blooming / halo effect',
          'Contrast not as good as OLED',
          'Higher cost',
          'Light bleed when zones are too coarse'
        ],
        suitable: ['HDR 影音', '明亮环境使用', '游戏娱乐', '多用途场景'],
        suitableEn: ['HDR media', 'Bright environments', 'Gaming & entertainment', 'Multi-purpose use'],
        unsuitable: ['极度暗室环境', '预算有限', '需要极致色彩准确'],
        unsuitableEn: ['Pitch-dark rooms', 'Budget-limited', 'Extreme color accuracy needed']
      }
    ],

    burnIn: {
      what: '残影与烧屏',
      whatEn: 'Image Retention & Burn-in',
      causes: '长时间显示同一静态画面（如任务栏、图标、台标），导致 OLED 像素老化不均匀，在屏幕上留下永久性残影。',
      causesEn: 'Displaying the same static content (taskbar, icons, channel logos) for extended periods causes uneven OLED pixel aging, leaving permanent afterimages on screen.',
      mitigation: [
        '使用屏幕保护程序，闲置 5 分钟后自动开启',
        '定期运行像素刷新（Pixel Refresh）功能',
        '避免长时间最大亮度使用',
        '使用深色主题，减少高亮度静态元素',
        '定期变换桌面壁纸',
        '开启自动隐藏任务栏',
        '每使用 4 小时关机休息 15 分钟'
      ],
      mitigationEn: [
        'Use a screensaver — auto-activate after 5 min idle',
        'Run Pixel Refresh regularly',
        'Avoid prolonged max-brightness usage',
        'Use dark themes to reduce bright static elements',
        'Rotate desktop wallpaper regularly',
        'Enable auto-hide taskbar',
        'Power off for 15 minutes after every 4 hours of use'
      ],
      riskFactors: [
        'OLED 面板风险最高，尤其是早期型号',
        '长时间 100% 亮度使用显著增加风险',
        '固定 UI 元素（任务栏、频道台标）是主要诱因',
        '使用时间超过 3 年后风险显著增加',
        'Mini-LED 和 IPS/VA 面板几乎无此问题'
      ],
      riskFactorsEn: [
        'OLED panels are highest risk, especially early models',
        'Prolonged 100% brightness significantly increases risk',
        'Static UI elements (taskbar, channel logos) are primary triggers',
        'Risk increases noticeably after 3+ years of use',
        'Mini-LED and IPS/VA panels have virtually no burn-in issues'
      ]
    },

    refreshRate: {
      comparisons: [
        { rate: 60, label: '60Hz', labelEn: '60Hz', useCase: '办公、网页浏览、标准视频。日常使用足够，但滚动和动画不够顺滑。', useCaseEn: 'Office work, web browsing, standard video. Sufficient for daily use but scrolling & animation feel less smooth.' },
        { rate: 120, label: '120Hz', labelEn: '120Hz', useCase: '流畅滚动、轻度游戏。日常体验明显优于 60Hz，macOS 推荐。', useCaseEn: 'Smooth scrolling, casual gaming. Noticeably better daily experience than 60Hz; recommended for macOS.' },
        { rate: 144, label: '144Hz', labelEn: '144Hz', useCase: '竞技游戏入门。射击和赛车类游戏体验显著提升。', useCaseEn: 'Entry-level competitive gaming. Significant improvement for shooters and racing games.' },
        { rate: 240, label: '240Hz+', labelEn: '240Hz+', useCase: '专业电竞。极致流畅，需要高端 GPU 支持才能发挥全部实力。', useCaseEn: 'Professional esports. Ultra-smooth; requires a high-end GPU to reach full potential.' }
      ]
    },

    interfaces: {
      note: '接口带宽详细数据请参考 Constants.INTERFACE_BANDWIDTH。常见接口包括 DP 1.4、DP 2.0、HDMI 2.0、HDMI 2.1 和 USB-C DP Alt Mode。选择接口时需确保其最大带宽大于所需信号带宽。',
      noteEn: 'See Constants.INTERFACE_BANDWIDTH for detailed interface bandwidth data. Common interfaces include DP 1.4, DP 2.0, HDMI 2.0, HDMI 2.1, and USB-C DP Alt Mode. Ensure the interface\'s maximum bandwidth exceeds the required signal bandwidth.'
    }
  };

  window.PanelGuideData = PanelGuideData;
})();
