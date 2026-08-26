import { describe, expect, it } from 'vitest';
import {
  calculateNetwork,
  calculatePower,
  calculateStorage,
  calculateVideo,
  formatCompactSize,
  formatDuration,
  storageBytesFor,
} from '../lib/units';

const COPY_FIELDS = [
  'unitExplanation',
  'realityNote',
  'formula',
  'summary',
  'warning',
  'directAnswer',
  'modeLabel',
  'solvedLabel',
  'theoryLine',
  'theoreticalTimeLine',
  'effectiveTimeLine',
  'scenarioLabel',
] as const;

function assertNoCopyFields(result: Record<string, unknown>) {
  for (const field of COPY_FIELDS) {
    expect(result, `calc layer must not carry copy field "${field}"`).not.toHaveProperty(field);
  }
}

describe('storage 计算', () => {
  it('TB 按十进制换算 bytes', () => {
    const result = calculateStorage(4, 'TB');
    expect(result.exactBytes).toBe(4_000_000_000_000);
    expect(formatCompactSize(result.exactBytes)).toMatch(/3\.64 TiB/);
    expect(result.differencePercent).toBeGreaterThan(9);
    assertNoCopyFields(result as unknown as Record<string, unknown>);
  });

  it('TiB 按二进制换算 bytes', () => {
    expect(storageBytesFor(1, 'TiB')).toBe(1_099_511_627_776);
  });
});

describe('network 计算', () => {
  it('1000Mbps 对应 125MB/s 理论吞吐', () => {
    const result = calculateNetwork({
      bandwidthValue: 1000,
      bandwidthUnit: 'Mbps',
      sizeValue: 1,
      sizeUnit: 'TiB',
      efficiency: 85,
    });

    expect(result.theoreticalMBps).toBe(125);
    expect(result.effectiveSeconds).toBeGreaterThan(result.theoreticalSeconds);
    assertNoCopyFields(result as unknown as Record<string, unknown>);
  });
});

describe('power 计算', () => {
  it('30W 全年电费估算', () => {
    const result = calculatePower({
      watt: 30,
      hoursPerDay: 24,
      daysPerYear: 365,
      price: 0.56,
    });

    expect(result.annualKWh).toBe(262.8);
    expect(Number(result.annualCost.toFixed(2))).toBe(147.17);
    assertNoCopyFields(result as unknown as Record<string, unknown>);
  });
});

describe('video 计算', () => {
  it('由码率与时长求文件大小', () => {
    const result = calculateVideo({
      mode: 'size',
      bitrateValue: 8,
      bitrateUnit: 'Mbps',
      durationValue: 1,
      durationUnit: 'h',
      sizeValue: 0,
      sizeUnit: 'GB',
      audioBitrateValue: 128,
      audioBitrateUnit: 'Kbps',
      overheadPercent: 1,
    });

    const expectedBytes = (8_000_000 + 128_000) * 1.01 * 3600 / 8;
    expect(Math.round(result.solvedSizeBytes)).toBe(Math.round(expectedBytes));
    expect(result.mode).toBe('size');
    expect(result.clampedToZero).toBe(false);
    assertNoCopyFields(result as unknown as Record<string, unknown>);
  });

  it('由大小与码率求时长', () => {
    const result = calculateVideo({
      mode: 'duration',
      bitrateValue: 8,
      bitrateUnit: 'Mbps',
      durationValue: 0,
      durationUnit: 'h',
      sizeValue: 100,
      sizeUnit: 'GB',
      audioBitrateValue: 128,
      audioBitrateUnit: 'Kbps',
      overheadPercent: 1,
    });

    const totalBps = 8_000_000 + 128_000;
    const expectedSeconds = (100_000_000_000 * 8) / (totalBps * 1.01);
    expect(Math.round(result.solvedDurationSeconds)).toBe(Math.round(expectedSeconds));
    expect(result.solvedDurationSeconds).toBeGreaterThan(0);
  });

  it('大小与时长不足以覆盖音频时钳到 0 并置 clampedToZero', () => {
    const result = calculateVideo({
      mode: 'bitrate',
      bitrateValue: 0,
      bitrateUnit: 'Mbps',
      durationValue: 2,
      durationUnit: 'h',
      sizeValue: 50,
      sizeUnit: 'GB',
      audioBitrateValue: 192,
      audioBitrateUnit: 'Kbps',
      overheadPercent: 1,
    });

    const expectedBps = (50_000_000_000 * 8) / (7200 * 1.01) - 192_000;
    expect(Math.round(result.solvedBitrateBps)).toBe(Math.round(expectedBps));
    expect(result.solvedBitrateBps).toBeGreaterThan(0);

    const clamped = calculateVideo({
      mode: 'bitrate',
      bitrateValue: 0,
      bitrateUnit: 'Mbps',
      durationValue: 2,
      durationUnit: 'h',
      sizeValue: 0.001,
      sizeUnit: 'GB',
      audioBitrateValue: 192,
      audioBitrateUnit: 'Kbps',
      overheadPercent: 1,
    });
    expect(clamped.solvedBitrateBps).toBe(0);
    expect(clamped.clampedToZero).toBe(true);
  });
});

describe('formatDuration 注入文案', () => {
  it('使用调用方提供的语言词组', () => {
    const zh = { approx: '约', hr: '小时', min: '分钟', sec: '秒' };
    const en = { approx: '~', hr: 'hr', min: 'min', sec: 'sec' };

    expect(formatDuration(3661, zh)).toBe('约 1 小时 1 分钟');
    expect(formatDuration(3661, en)).toBe('~ 1 hr 1 min');
    expect(formatDuration(42, zh)).toBe('约 42 秒');
  });
});
