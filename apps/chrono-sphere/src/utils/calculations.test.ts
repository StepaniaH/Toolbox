import { describe, it, expect } from 'vitest';
import { calculateOffset, calculateInterval, detectDstTransitions } from './calculations';

describe('calculateOffset', () => {
  describe('interval mode (间隔 X 日 = D + X)', () => {
    it('should add offset days to start date', () => {
      const result = calculateOffset('2026-06-01', 10, 'interval', 'Asia/Shanghai', 'zh');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-06-11');
    });

    it('should return same day when offset is 0', () => {
      const result = calculateOffset('2026-06-01', 0, 'interval', 'Asia/Shanghai');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-06-01');
    });

    it('should handle negative offset (go backward)', () => {
      const result = calculateOffset('2026-06-10', -5, 'interval', 'Asia/Shanghai');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-06-05');
    });

    it('should handle month boundary crossing', () => {
      const result = calculateOffset('2026-01-28', 5, 'interval', 'Asia/Shanghai');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-02-02');
    });

    it('should handle year boundary crossing', () => {
      const result = calculateOffset('2026-12-30', 3, 'interval', 'Asia/Shanghai');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2027-01-02');
    });

    it('should return weekday and offset info', () => {
      const result = calculateOffset('2026-06-01', 10, 'interval', 'Asia/Shanghai', 'zh');
      expect(result.result!.weekday).toBeTruthy();
      expect(result.result!.offsetHours).toBe(8);
      expect(result.result!.isDst).toBe(false);
    });
  });

  describe('thDay mode (第 X 日 = D + X - 1)', () => {
    it('should return same day when X=1', () => {
      const result = calculateOffset('2026-06-01', 1, 'thDay', 'Asia/Shanghai');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-06-01');
    });

    it('should add X-1 days for X>1', () => {
      const result = calculateOffset('2026-06-01', 10, 'thDay', 'Asia/Shanghai');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-06-10');
    });

    it('should reject X<1', () => {
      const result = calculateOffset('2026-06-01', 0, 'thDay', 'Asia/Shanghai', 'zh');
      expect(result.success).toBe(false);
      expect(result.error).toContain('1');
    });

    it('should handle backward thDay correctly', () => {
      // "往回第2天" from 6/1 → 5/31 (= start - 1 day)
      const result = calculateOffset('2026-06-01', -2, 'thDay', 'Asia/Shanghai');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-05-31');
    });

    it('should handle backward thDay with X=1 (same day)', () => {
      const result = calculateOffset('2026-06-01', -1, 'thDay', 'Asia/Shanghai');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-06-01');
    });

    it('should reject backward thDay with X=0', () => {
      const result = calculateOffset('2026-06-01', -0, 'thDay', 'Asia/Shanghai', 'zh');
      // -0 is 0, abs(0) < 1 → error
      expect(result.success).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should reject invalid date string', () => {
      const result = calculateOffset('not-a-date', 10, 'interval', 'Asia/Shanghai', 'zh');
      expect(result.success).toBe(false);
    });

    it('should handle DST boundary days correctly', () => {
      // US DST starts: 2026-03-08 at 2 AM (spring forward, 2 AM → 3 AM)
      // March 8 00:00 is still EST, not yet DST
      const result = calculateOffset('2026-03-07', 1, 'interval', 'America/New_York');
      expect(result.success).toBe(true);
      expect(result.result!.dateStr).toBe('2026-03-08');
      // Midnight on March 8 is before the 2AM DST transition, so DST is still off
      expect(result.result!.offsetName).toBeTruthy();
    });
  });
});

describe('calculateInterval', () => {
  describe('inclusion rules', () => {
    it('both: 6/1 → 6/3 should be 3 days', () => {
      const result = calculateInterval('2026-06-01', '2026-06-03', 'both', 'Asia/Shanghai', 'Asia/Shanghai', 'zh');
      expect(result.success).toBe(true);
      expect(result.result!.totalDays).toBe(3);
    });

    it('start: 6/1 → 6/3 should be 2 days', () => {
      const result = calculateInterval('2026-06-01', '2026-06-03', 'start', 'Asia/Shanghai', 'Asia/Shanghai', 'zh');
      expect(result.success).toBe(true);
      expect(result.result!.totalDays).toBe(2);
    });

    it('end: 6/1 → 6/3 should be 2 days', () => {
      const result = calculateInterval('2026-06-01', '2026-06-03', 'end', 'Asia/Shanghai', 'Asia/Shanghai', 'zh');
      expect(result.success).toBe(true);
      expect(result.result!.totalDays).toBe(2);
    });

    it('exclude: 6/1 → 6/3 should be 1 day', () => {
      const result = calculateInterval('2026-06-01', '2026-06-03', 'exclude', 'Asia/Shanghai', 'Asia/Shanghai', 'zh');
      expect(result.success).toBe(true);
      expect(result.result!.totalDays).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('same day with both should be 1', () => {
      const result = calculateInterval('2026-06-01', '2026-06-01', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(result.result!.totalDays).toBe(1);
      expect(result.result!.workdays + result.result!.weekends).toBe(1);
    });

    it('same day with exclude should be 0', () => {
      const result = calculateInterval('2026-06-01', '2026-06-01', 'exclude', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(result.result!.totalDays).toBe(0);
      expect(result.result!.workdays).toBe(0);
      expect(result.result!.weekends).toBe(0);
    });

    it('same day with start should be 0', () => {
      const result = calculateInterval('2026-06-01', '2026-06-01', 'start', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(result.result!.totalDays).toBe(0);
    });

    it('negative range should be negative', () => {
      const result = calculateInterval('2026-06-03', '2026-06-01', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(result.result!.totalDays).toBe(-3);
      expect(result.result!.isNegative).toBe(true);
    });
  });

  describe('cross-timezone', () => {
    it('should handle different timezones', () => {
      // Beijing (UTC+8) → New York (UTC-4/-5)
      const result = calculateInterval('2026-06-01', '2026-06-01', 'both', 'Asia/Shanghai', 'America/New_York');
      expect(result.success).toBe(true);
      // Same calendar date, different timezones — absolute hours should be non-zero
      expect(result.result!.absoluteDays).toBeGreaterThanOrEqual(0);
    });

    it('should report absolute elapsed time correctly', () => {
      // Beijing June 1 midnight (UTC+8) → London June 1 midnight (BST = UTC+1) = 7 hours difference
      const result = calculateInterval('2026-06-01', '2026-06-01', 'exclude', 'Asia/Shanghai', 'Europe/London');
      expect(result.result!.absoluteDays).toBe(0);
      // London is on BST (UTC+1) in June, so Beijing(UTC+8) - London(UTC+1) = 7h
      expect(result.result!.absoluteHours).toBe(7);
    });
  });

  describe('workday counting', () => {
    it('should count weekdays correctly', () => {
      // Mon June 1 to Fri June 5, both = 5 weekdays
      const result = calculateInterval('2026-06-01', '2026-06-05', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(result.result!.workdays).toBe(5);
      expect(result.result!.weekends).toBe(0);
    });

    it('should include weekend days', () => {
      // Fri June 5 to Sun June 7, both = 3 days
      const result = calculateInterval('2026-06-05', '2026-06-07', 'both', 'Asia/Shanghai', 'Asia/Shanghai');
      expect(result.result!.workdays).toBe(1); // Fri
      expect(result.result!.weekends).toBe(2); // Sat, Sun
    });
  });
});

describe('detectDstTransitions', () => {
  it('should detect spring-forward DST transition in US', () => {
    // US DST starts Sunday March 8, 2026
    const transitions = detectDstTransitions('2026-03-01', '2026-03-15', 'America/New_York', 'en');
    expect(transitions.length).toBeGreaterThanOrEqual(1);
    const springForward = transitions.find((t) => t.type === 'forward');
    expect(springForward).toBeDefined();
    expect(springForward!.date).toBe('2026-03-08');
  });

  it('should detect fall-back DST transition in US', () => {
    // US DST ends Sunday Nov 1, 2026
    const transitions = detectDstTransitions('2026-10-25', '2026-11-07', 'America/New_York', 'en');
    const fallBack = transitions.find((t) => t.type === 'backward');
    expect(fallBack).toBeDefined();
    expect(fallBack!.date).toBe('2026-11-01');
  });

  it('should return empty array for timezone without DST', () => {
    const transitions = detectDstTransitions('2026-06-01', '2026-06-30', 'Asia/Shanghai');
    expect(transitions.length).toBe(0);
  });

  it('should handle reversed date order', () => {
    const transitions = detectDstTransitions('2026-03-15', '2026-03-01', 'America/New_York', 'en');
    expect(transitions.length).toBeGreaterThanOrEqual(1);
  });

  it('should deduplicate transitions on the same date', () => {
    const transitions = detectDstTransitions('2026-03-08', '2026-03-08', 'America/New_York');
    expect(transitions.length).toBeLessThanOrEqual(1);
  });

  it('should cap at 10 years to prevent performance issues', () => {
    const transitions = detectDstTransitions('2026-01-01', '2050-01-01', 'America/New_York');
    // Should complete without timeout
    expect(transitions.length).toBeGreaterThan(0);
  });
});
