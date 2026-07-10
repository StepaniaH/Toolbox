/**
 * constants.js — Static reference data for the monitor-choice app.
 * Zero DOM dependencies. Attaches to window.Constants.
 */
(function () {
  'use strict';

  /** Common display resolutions with aspect ratio metadata. */
  var RESOLUTIONS = [
    { label: '1920 × 1080 (FHD)',  w: 1920, h: 1080, ar: '16:9' },
    { label: '2560 × 1440 (QHD)',  w: 2560, h: 1440, ar: '16:9' },
    { label: '2560 × 1600',         w: 2560, h: 1600, ar: '16:10' },
    { label: '3440 × 1440 (UWQHD)', w: 3440, h: 1440, ar: '21:9' },
    { label: '3840 × 2160 (4K UHD)', w: 3840, h: 2160, ar: '16:9' },
    { label: '5120 × 2880 (5K)',    w: 5120, h: 2880, ar: '16:9' },
    { label: '6016 × 3384 (6K)',    w: 6016, h: 3384, ar: '16:9' }
  ];

  /** Aspect ratio string → numeric ratio components. */
  var ASPECT_RATIOS = {
    '16:9':  { w: 16, h: 9 },
    '16:10': { w: 16, h: 10 },
    '21:9':  { w: 21, h: 9 }
  };

  /** CIE 1931 chromaticity coordinates for standard colour gamut primaries. */
  var GAMUT_COORDINATES = {
    srgb: {
      R: [0.640, 0.330],
      G: [0.300, 0.600],
      B: [0.150, 0.060]
    },
    dciP3: {
      R: [0.680, 0.320],
      G: [0.265, 0.690],
      B: [0.150, 0.060]
    },
    adobeRGB: {
      R: [0.640, 0.330],
      G: [0.210, 0.710],
      B: [0.150, 0.060]
    },
    bt2020: {
      R: [0.708, 0.292],
      G: [0.170, 0.797],
      B: [0.131, 0.046]
    }
  };

  /** Panel type reference data with realistic specifications. */
  var PANEL_TYPES = [
    {
      id: 'ips',
      name: 'IPS',
      contrastRatio: '1000:1',
      gamut: 'sRGB 100% / DCI-P3 ~90%',
      deltaE: '<2',
      pros: ['色彩准确', '可视角度大', '适合专业工作'],
      prosEn: ['Accurate color', 'Wide viewing angles', 'Great for pro work'],
      cons: ['原生对比度低', '存在 IPS Glow'],
      consEn: ['Low native contrast', 'IPS Glow effect'],
      suitable: ['设计', '修图', '日常办公'],
      unsuitable: ['暗房环境使用']
    },
    {
      id: 'va',
      name: 'VA',
      contrastRatio: '3000:1 ~ 4000:1',
      gamut: 'sRGB 110% / DCI-P3 ~85%',
      deltaE: '<3',
      pros: ['对比度高', '黑色表现深沉'],
      prosEn: ['High contrast', 'Deep blacks'],
      cons: ['响应速度较慢', '曲面型号较多'],
      consEn: ['Slower response', 'Many curved models'],
      suitable: ['影音娱乐', '游戏'],
      unsuitable: ['专业修图']
    },
    {
      id: 'tn',
      name: 'TN',
      contrastRatio: '1000:1',
      gamut: 'sRGB 100%',
      deltaE: '<5',
      pros: ['响应速度极快', '价格低廉'],
      prosEn: ['Ultra-fast response', 'Low cost'],
      cons: ['可视角度小', '色彩表现差'],
      consEn: ['Narrow viewing angles', 'Poor color'],
      suitable: ['竞技游戏'],
      unsuitable: ['设计', '影音娱乐']
    },
    {
      id: 'oled',
      name: 'OLED',
      contrastRatio: '∞:1',
      gamut: 'DCI-P3 99% / BT.2020 ~75%',
      deltaE: '<1',
      pros: ['完美黑色', '响应极快', '色彩极佳'],
      prosEn: ['Perfect blacks', 'Ultra-fast response', 'Excellent color'],
      cons: ['烧屏风险', '峰值亮度有限', '价格高昂'],
      consEn: ['Burn-in risk', 'Limited peak brightness', 'Expensive'],
      suitable: ['HDR', '影视', '游戏'],
      unsuitable: ['长时间静态画面']
    },
    {
      id: 'mini-led',
      name: 'Mini-LED',
      contrastRatio: '5000:1 ~ 100000:1',
      gamut: 'DCI-P3 95%+ / BT.2020 ~80%',
      deltaE: '<2',
      pros: ['高亮度', '高分区控光', '无烧屏风险'],
      prosEn: ['High brightness', 'Many dimming zones', 'No burn-in risk'],
      cons: ['存在光晕现象', '价格较高'],
      consEn: ['Blooming/halo effect', 'Higher cost'],
      suitable: ['HDR', '影音', '游戏'],
      unsuitable: ['极暗环境下的精细对比']
    }
  ];

  /** Interface bandwidth limits in Gbps. */
  var INTERFACE_BANDWIDTH = {
    dp14:  { name: 'DisplayPort 1.4',     rate: 25.92 },
    dp20:  { name: 'DisplayPort 2.0',     rate: 77.37 },
    hdmi20:{ name: 'HDMI 2.0',            rate: 14.4  },
    hdmi21:{ name: 'HDMI 2.1',            rate: 42.6  },
    usbCdP:{ name: 'USB-C DP Alt Mode',   rate: 25.92 }
  };

  /**
   * CIE 1931 2° standard observer spectral locus coordinates.
   * ~55 [x, y] pairs from 380 nm to 700 nm, tracing the horseshoe.
   */
  var CIE_1931_LOCUS = [
    [0.1741, 0.0050],
    [0.1740, 0.0050],
    [0.1738, 0.0049],
    [0.1736, 0.0049],
    [0.1733, 0.0048],
    [0.1730, 0.0048],
    [0.1726, 0.0048],
    [0.1721, 0.0048],
    [0.1714, 0.0051],
    [0.1703, 0.0058],
    [0.1689, 0.0069],
    [0.1669, 0.0086],
    [0.1644, 0.0109],
    [0.1611, 0.0138],
    [0.1566, 0.0177],
    [0.1510, 0.0227],
    [0.1440, 0.0297],
    [0.1355, 0.0399],
    [0.1241, 0.0578],
    [0.1096, 0.0868],
    [0.0913, 0.1327],
    [0.0687, 0.2007],
    [0.0454, 0.2950],
    [0.0235, 0.4127],
    [0.0082, 0.5384],
    [0.0039, 0.6548],
    [0.0139, 0.7502],
    [0.0389, 0.8120],
    [0.0743, 0.8338],
    [0.1142, 0.8262],
    [0.1547, 0.8059],
    [0.1929, 0.7816],
    [0.2296, 0.7543],
    [0.2658, 0.7243],
    [0.3016, 0.6923],
    [0.3373, 0.6589],
    [0.3731, 0.6245],
    [0.4087, 0.5896],
    [0.4441, 0.5547],
    [0.4788, 0.5202],
    [0.5125, 0.4866],
    [0.5448, 0.4544],
    [0.5752, 0.4242],
    [0.6029, 0.3965],
    [0.6270, 0.3725],
    [0.6482, 0.3514],
    [0.6658, 0.3340],
    [0.6801, 0.3197],
    [0.6915, 0.3083],
    [0.7079, 0.2920],
    [0.7190, 0.2809],
    [0.7260, 0.2740],
    [0.7300, 0.2700],
    [0.7320, 0.2680],
    [0.7347, 0.2653]
  ];

  /** Use-case → required colour gamut mapping. */
  var SCENE_GAMUT_NEEDS = {
    coding:        'sRGB 100%',
    webDesign:     'sRGB 100%',
    videoEditing:  'DCI-P3 90%+',
    printProofing: 'Adobe RGB 95%+',
    hdrCreation:   'BT.2020 70%+',
    gaming:        'DCI-P3 85%+',
    daily:         'sRGB 99%+'
  };

  window.Constants = {
    RESOLUTIONS: RESOLUTIONS,
    ASPECT_RATIOS: ASPECT_RATIOS,
    GAMUT_COORDINATES: GAMUT_COORDINATES,
    PANEL_TYPES: PANEL_TYPES,
    INTERFACE_BANDWIDTH: INTERFACE_BANDWIDTH,
    CIE_1931_LOCUS: CIE_1931_LOCUS,
    SCENE_GAMUT_NEEDS: SCENE_GAMUT_NEEDS
  };
})();
