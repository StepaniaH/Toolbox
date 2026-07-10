/**
 * calc.js — Pure display-optics calculation functions.
 * Zero DOM dependencies. Exports ESM functions and keeps window.Calc as a
 * compatibility bridge for the existing tab controllers.
 */

  /**
   * Clamp a value between min and max (inclusive).
   * @param {number} v  - Value to clamp.
   * @param {number} min - Lower bound.
   * @param {number} max - Upper bound.
   * @returns {number}
   */
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  /** PPD quality thresholds. */
  var PPD_THRESHOLDS = {
    POOR: 30,
    FAIR: 45,
    GOOD: 60,
    EXCELLENT: 80,
    RETINA: 60
  };

  /**
   * Compute pixels-per-inch from resolution and diagonal.
   * @param {number} width    - Horizontal pixel count.
   * @param {number} height   - Vertical pixel count.
   * @param {number} diagonal - Diagonal size in inches.
   * @returns {number} PPI.
   */
  function computePPI(width, height, diagonal) {
    if (!diagonal || diagonal <= 0) return 0;
    return Math.sqrt(width * width + height * height) / diagonal;
  }

  /**
   * Compute pixels-per-degree from PPI and viewing distance.
   * @param {number} ppi        - Pixels per inch.
   * @param {number} distanceCm - Viewing distance in centimetres.
   * @returns {number} Pixels per degree of visual angle.
   */
  function computePPD(ppi, distanceCm) {
    if (!ppi || ppi <= 0) return 0;
    var distanceInch = distanceCm / 2.54;
    return 2 * distanceInch * Math.tan(0.5 * Math.PI / 180) * ppi;
  }

  /**
   * Compute the distance at which PPD equals 60 ("retina").
   * @param {number} ppi - Pixels per inch.
   * @returns {number} Distance in centimetres.
   */
  function computeRetinaDistance(ppi) {
    if (!ppi || ppi <= 0) return 0;
    return (3437.75 / ppi) * 2.54;
  }

  /**
   * Resolve physical screen dimensions from diagonal and aspect ratio.
   * @param {number} diagonalInch - Diagonal size in inches.
   * @param {string} aspectRatio  - Aspect ratio string, e.g. '16:9'.
   * @returns {{widthCm:number, heightCm:number}} Dimensions in centimetres.
   */
  function resolveDimensions(diagonalInch, aspectRatio) {
    var parts = String(aspectRatio).split(':');
    var aw = parseFloat(parts[0]);
    var ah = parseFloat(parts[1]);
    var hyp = Math.sqrt(aw * aw + ah * ah);
    var widthInch = diagonalInch * (aw / hyp);
    var heightInch = diagonalInch * (ah / hyp);
    return {
      widthCm: widthInch * 2.54,
      heightCm: heightInch * 2.54
    };
  }

  /**
   * Compute horizontal field of view subtended by the screen.
   * @param {number} diagonalInch - Diagonal size in inches.
   * @param {string} aspectRatio  - Aspect ratio string, e.g. '16:9'.
   * @param {number} distanceCm   - Viewing distance in centimetres.
   * @returns {number} Horizontal FOV in degrees.
   */
  function computeHorizontalFOV(diagonalInch, aspectRatio, distanceCm) {
    var dims = resolveDimensions(diagonalInch, aspectRatio);
    var widthCm = dims.widthCm;
    return 2 * Math.atan(widthCm / (2 * distanceCm)) * (180 / Math.PI);
  }

  /**
   * Compute recommended THX viewing distance.
   * @param {number} diagonalInch - Diagonal size in inches.
   * @returns {number} Distance in centimetres.
   */
  function computeTHXDistance(diagonalInch) {
    return (diagonalInch / 0.84) * 2.54;
  }

  /**
   * Compute SMPTE recommended viewing distance range.
   * @param {number} diagonalInch - Diagonal size in inches.
   * @returns {{min:number, max:number}} Range in centimetres.
   */
  function computeSMPTERange(diagonalInch) {
    return {
      min: (diagonalInch / 0.625) * 2.54,
      max: (diagonalInch / 0.417) * 2.54
    };
  }

  /**
   * Compute a text-comfort score and label from PPD and work percentage.
   * @param {number} ppd           - Pixels per degree.
   * @param {number} workPercentage - Percentage of time spent on text work (0-100).
   * @returns {{score:number, label:string}} Score 0-100 and Chinese label.
   */
  function computeTextComfort(ppd, workPercentage) {
    var score = clamp(
      (ppd / 60) * 100 - Math.max(0, 60 - ppd) * 0.5 + workPercentage * 0.1,
      0,
      100
    );

    var label;
    if (score < 30) {
      label = '差';
    } else if (score < 45) {
      label = '一般';
    } else if (score < 60) {
      label = '良好';
    } else if (score <= 80) {
      label = '优秀';
    } else {
      label = '极致';
    }

    return { score: score, label: label };
  }

  /**
   * Compute required interface bandwidth for a given video mode.
   * @param {number} width      - Horizontal pixel count.
   * @param {number} height     - Vertical pixel count.
   * @param {number} refreshRate - Refresh rate in Hz.
   * @param {number} colorDepth  - Bits per channel (8, 10, or 12).
   * @returns {number} Bandwidth in Gbps.
   */
  function computeInterfaceBandwidth(width, height, refreshRate, colorDepth) {
    return (width * height * refreshRate * colorDepth) / 1e9;
  }

  /**
   * Compute usable desk depth and maximum recommended diagonal.
   * @param {number} deskDepthCm - Total desk depth in centimetres.
   * @returns {{usableDepthCm:number, maxDiagonalInch:number}}
   */
  function computeDeskConstraint(deskDepthCm) {
    var usableDepthCm = deskDepthCm - 25; // 10 cm eye-to-edge + 15 cm stand
    var maxDiagonalInch = usableDepthCm / 0.37; // empirical for 16:9
    return {
      usableDepthCm: usableDepthCm,
      maxDiagonalInch: maxDiagonalInch
    };
  }

var Calc = {
  clamp: clamp,
  PPD_THRESHOLDS: PPD_THRESHOLDS,
  computePPI: computePPI,
  computePPD: computePPD,
  computeRetinaDistance: computeRetinaDistance,
  resolveDimensions: resolveDimensions,
  computeHorizontalFOV: computeHorizontalFOV,
  computeTHXDistance: computeTHXDistance,
  computeSMPTERange: computeSMPTERange,
  computeTextComfort: computeTextComfort,
  computeInterfaceBandwidth: computeInterfaceBandwidth,
  computeDeskConstraint: computeDeskConstraint
};

if (typeof window !== 'undefined') window.Calc = Calc;

export {
  clamp,
  PPD_THRESHOLDS,
  computePPI,
  computePPD,
  computeRetinaDistance,
  resolveDimensions,
  computeHorizontalFOV,
  computeTHXDistance,
  computeSMPTERange,
  computeTextComfort,
  computeInterfaceBandwidth,
  computeDeskConstraint
};
export default Calc;
