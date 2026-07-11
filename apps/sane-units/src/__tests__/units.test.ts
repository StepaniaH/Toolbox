import { it, expect } from 'vitest';
import {
  calculateNetwork,
  calculatePower,
  calculateStorage,
  calculateVideo,
  storageBytesFor,
} from '../lib/units';

it('storage uses decimal bytes for TB', () => {
  const result = calculateStorage(4, 'TB');
  expect(result.exactBytes).toBe(4_000_000_000_000);
  expect(result.binaryDisplay).toMatch(/3\.64 TiB/);
});

it('storage uses binary bytes for TiB', () => {
  expect(storageBytesFor(1, 'TiB')).toBe(1_099_511_627_776);
});

it('network converts Mbps to MB/s', () => {
  const result = calculateNetwork({
    bandwidthValue: 1000,
    bandwidthUnit: 'Mbps',
    sizeValue: 1,
    sizeUnit: 'TiB',
    efficiency: 85,
    scenario: 'wired-lan',
  });

  expect(result.theoreticalMBps).toBe(125);
  expect(result.theoryLine).toMatch(/125 MB\/s/);
});

it('power estimates annual cost', () => {
  const result = calculatePower({
    watt: 30,
    hoursPerDay: 24,
    daysPerYear: 365,
    price: 0.56,
  });

  expect(result.annualKWh).toBe(262.8);
  expect(Number(result.annualCost.toFixed(2))).toBe(147.17);
});

it('video solves file size from bitrate and duration', () => {
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
});

it('video solves duration from size and bitrate', () => {
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

it('video solves bitrate from size and duration', () => {
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
});
