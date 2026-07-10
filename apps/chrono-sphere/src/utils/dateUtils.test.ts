import { describe, it, expect } from 'vitest';
import {
  calculateOffset,
  calculateInterval,
  detectDstTransitions,
  getAvailableTimezones,
  getFriendlyZoneLabel,
  getZoneShortLabel,
  formatUtcOffset,
  getLunarDetails,
  convertLunarToSolar,
} from './dateUtils';

describe('dateUtils re-exports', () => {
  it('should expose all expected functions as callable', () => {
    expect(typeof calculateOffset).toBe('function');
    expect(typeof calculateInterval).toBe('function');
    expect(typeof detectDstTransitions).toBe('function');
    expect(typeof getAvailableTimezones).toBe('function');
    expect(typeof getFriendlyZoneLabel).toBe('function');
    expect(typeof getZoneShortLabel).toBe('function');
    expect(typeof formatUtcOffset).toBe('function');
    expect(typeof getLunarDetails).toBe('function');
    expect(typeof convertLunarToSolar).toBe('function');
  });
});

describe('calculateOffset — date add/subtract edge cases', () => {
  describe('leap year (Feb 29) boundaries', () => {
    it('Feb 29 + 1 day in leap year 2024 → Mar 1', () => {
      const r = calculateOffset('2024-02-29', 1, 'interval', 'Asia/Shanghai');
      expect(r.success).toBe(true);
      expect(r.result!.dateStr).toBe('2024-03-01');
    });

    it('Feb 28 + 1 day in leap year 2024 → Feb 29 (leap day exists)', () => {
      const r = calculateOffset('2024-02-28', 1, 'interval', 'Asia/Shanghai');
      expect(r.success).toBe(true);
      expect(r.result!.dateStr).toBe('2024-02-29');
    });

    it('Feb 28 + 1 day in non-leap year 2023 → Mar 1 (no leap day)', () => {
      const r = calculateOffset('2023-02-28', 1, 'interval', 'Asia/Shanghai');
      expect(r.success).toBe(true);
      expect(r.result!.dateStr).toBe('2023-03-01');
    });

    it('leap day itself (2024-02-29) is a valid start', () => {
      const r = calculateOffset('2024-02-29', 0, 'interval', 'Asia/Shanghai');
      expect(r.success).toBe(true);
      expect(r.result!.dateStr).toBe('2024-02-29');
    });

    it('Feb 29 - 1 day → Feb 28', () => {
      const r = calculateOffset('2024-02-29', -1, 'interval', 'Asia/Shanghai');
      expect(r.success).toBe(true);
      expect(r.result!.dateStr).toBe('2024-02-28');
    });
  });

  describe('cross-month boundaries', () => {
    it('Jan 31 + 1 day → Feb 1', () => {
      const r = calculateOffset('2026-01-31', 1, 'interval', 'Asia/Shanghai');
      expect(r.result!.dateStr).toBe('2026-02-01');
    });

    it('Mar 31 - 1 day → Mar 30 (same month, backward)', () => {
      const r = calculateOffset('2026-03-31', -1, 'interval', 'Asia/Shanghai');
      expect(r.result!.dateStr).toBe('2026-03-30');
    });

    it('Apr 30 + 1 day → May 1 (30-day month)', () => {
      const r = calculateOffset('2026-04-30', 1, 'interval', 'Asia/Shanghai');
      expect(r.result!.dateStr).toBe('2026-05-01');
    });
  });

  describe('cross-year boundaries', () => {
    it('Dec 31 2026 + 1 day → Jan 1 2027', () => {
      const r = calculateOffset('2026-12-31', 1, 'interval', 'Asia/Shanghai');
      expect(r.result!.dateStr).toBe('2027-01-01');
    });

    it('Jan 1 2027 - 1 day → Dec 31 2026', () => {
      const r = calculateOffset('2027-01-01', -1, 'interval', 'Asia/Shanghai');
      expect(r.result!.dateStr).toBe('2026-12-31');
    });

    it('Dec 31 2026 + 366 days → Jan 1 2028 (across leap year 2024-free path)', () => {
      // 2027 is non-leap (365 days): Dec 31 2026 + 366 = Jan 1 2028
      const r = calculateOffset('2026-12-31', 366, 'interval', 'Asia/Shanghai');
      expect(r.result!.dateStr).toBe('2028-01-01');
    });
  });
});

describe('calculateInterval — week / workday / natural-day distinction', () => {
  describe('full-week workday math (周数计算)', () => {
    it('Mon–Sun (7 days) = 5 workdays + 2 weekends', () => {
      // 2026-06-01 is Mon → 2026-06-07 is Sun
      const r = calculateInterval('2026-06-01', '2026-06-07', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(r.result!.totalDays).toBe(7);
      expect(r.result!.workdays).toBe(5);
      expect(r.result!.weekends).toBe(2);
    });

    it('two full weeks (14 days) = 10 workdays + 4 weekends', () => {
      const r = calculateInterval('2026-06-01', '2026-06-14', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(r.result!.totalDays).toBe(14);
      expect(r.result!.workdays).toBe(10);
      expect(r.result!.weekends).toBe(4);
    });

    it('workday-only range (Mon–Fri) = 5 workdays + 0 weekends', () => {
      const r = calculateInterval('2026-06-01', '2026-06-05', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(r.result!.workdays).toBe(5);
      expect(r.result!.weekends).toBe(0);
    });

    it('weekend-only range (Sat–Sun) = 0 workdays + 2 weekends', () => {
      const r = calculateInterval('2026-06-06', '2026-06-07', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(r.result!.workdays).toBe(0);
      expect(r.result!.weekends).toBe(2);
    });
  });

  describe('natural-day (totalDays) vs workday distinction', () => {
    it('totalDays counts every calendar day, not just workdays', () => {
      // Fri → Sun: 3 natural days = 1 workday (Fri) + 2 weekends (Sat, Sun)
      const r = calculateInterval('2026-06-05', '2026-06-07', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(r.result!.totalDays).toBe(3);
      expect(r.result!.workdays + r.result!.weekends).toBe(r.result!.totalDays);
    });

    it('inclusion rules shift natural-day count without changing workday logic base', () => {
      const both = calculateInterval('2026-06-01', '2026-06-07', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      const exclude = calculateInterval('2026-06-01', '2026-06-07', 'exclude', 'Asia/Shanghai', 'Asia/Shanghai');
      // both = 7 days; exclude strips first AND last → 5 middle days
      expect(both.result!.totalDays).toBe(7);
      expect(exclude.result!.totalDays).toBe(5);
      // invariant holds for both
      expect(both.result!.workdays + both.result!.weekends).toBe(both.result!.totalDays);
      expect(exclude.result!.workdays + exclude.result!.weekends).toBe(exclude.result!.totalDays);
    });
  });
});

describe('calculateOffset — DateTime object creation & handling', () => {
  it('should parse a yyyy-MM-dd string into a valid DateResult', () => {
    const r = calculateOffset('2026-06-01', 0, 'interval', 'Asia/Shanghai');
    expect(r.success).toBe(true);
    const result = r.result!;
    expect(result.dateStr).toBe('2026-06-01');
    expect(typeof result.weekday).toBe('string');
    expect(result.weekday.length).toBeGreaterThan(0);
    expect(result.offsetHours).toBe(8); // Asia/Shanghai = UTC+8
    expect(typeof result.isDst).toBe('boolean');
    expect(result.offsetName).toBeTruthy();
  });

  it('should reject a non-date string (invalid DateTime)', () => {
    const r = calculateOffset('not-a-date', 5, 'interval', 'Asia/Shanghai');
    expect(r.success).toBe(false);
    expect(r.result).toBeUndefined();
    expect(r.error).toBeTruthy();
  });

  it('should reject a malformed date (month 13)', () => {
    const r = calculateOffset('2026-13-01', 1, 'interval', 'Asia/Shanghai');
    expect(r.success).toBe(false);
  });

  it('should carry locale into the weekday name', () => {
    const zh = calculateOffset('2026-06-01', 0, 'interval', 'Asia/Shanghai', 'zh');
    const en = calculateOffset('2026-06-01', 0, 'interval', 'Asia/Shanghai', 'en');
    // 2026-06-01 is Monday; exact strings depend on locale data, but they must differ
    expect(zh.result!.weekday).not.toBe(en.result!.weekday);
    expect(zh.result!.weekday.length).toBeGreaterThan(0);
    expect(en.result!.weekday.length).toBeGreaterThan(0);
  });

  it('should reflect timezone offset in offsetHours', () => {
    const ny = calculateOffset('2026-06-01', 0, 'interval', 'America/New_York');
    // New York in June is EDT = UTC-4 → offsetHours = -4
    expect(ny.result!.offsetHours).toBe(-4);
    expect(ny.result!.isDst).toBe(true);
  });
});
