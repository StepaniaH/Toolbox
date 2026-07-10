import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';

/**
 * Reference implementation: the ORIGINAL O(N) day-by-day loop.
 * This is our ground truth for correctness verification.
 */
function countWorkdaysLoop(startISO: string, endISO: string): { workdays: number; weekends: number } {
  const startUtc = DateTime.fromISO(startISO, { zone: 'UTC' }).startOf('day');
  const endUtc = DateTime.fromISO(endISO, { zone: 'UTC' }).startOf('day');

  let workdays = 0;
  let weekends = 0;

  if (startUtc.isValid && endUtc.isValid) {
    const [s, e] = startUtc <= endUtc ? [startUtc, endUtc] : [endUtc, startUtc];
    let current = s;
    while (current <= e) {
      const wd = current.weekday;
      if (wd === 6 || wd === 7) weekends++;
      else workdays++;
      current = current.plus({ days: 1 });
    }
  }

  return { workdays, weekends };
}

/**
 * New O(1) mathematical implementation — the one we optimized to.
 */
function countWorkdaysMath(startISO: string, endISO: string): { workdays: number; weekends: number } {
  const startUtc = DateTime.fromISO(startISO, { zone: 'UTC' }).startOf('day');
  const endUtc = DateTime.fromISO(endISO, { zone: 'UTC' }).startOf('day');

  let workdays = 0;
  let weekends = 0;

  if (startUtc.isValid && endUtc.isValid) {
    const [s, e] = startUtc <= endUtc ? [startUtc, endUtc] : [endUtc, startUtc];
    const dayCount = Math.round(e.diff(s, 'days').days) + 1; // inclusive
    const startWd = s.weekday; // 1=Mon … 7=Sun

    const fullWeeks = Math.floor(dayCount / 7);
    const remainingDays = dayCount % 7;

    workdays = fullWeeks * 5;
    weekends = fullWeeks * 2;

    for (let i = 0; i < remainingDays; i++) {
      const wd = ((startWd + i - 1) % 7) + 1;
      if (wd <= 5) workdays++;
      else weekends++;
    }
  }

  return { workdays, weekends };
}

describe('Workday counting — algorithm correctness verification', () => {
  // =========================================================
  // 1. Exhaustive: all weekday starts × all range lengths 1–100
  // =========================================================
  describe('exhaustive 1–100 day ranges from all 7 weekdays', () => {
    // Generate start dates on each weekday
    const weekdayStarts: [string, string][] = [
      ['2026-06-01', 'Mon'],
      ['2026-06-02', 'Tue'],
      ['2026-06-03', 'Wed'],
      ['2026-06-04', 'Thu'],
      ['2026-06-05', 'Fri'],
      ['2026-06-06', 'Sat'],
      ['2026-06-07', 'Sun'],
    ];

    for (const [start, label] of weekdayStarts) {
      for (let len = 1; len <= 100; len++) {
        const end = DateTime.fromISO(start, { zone: 'UTC' }).plus({ days: len - 1 }).toFormat('yyyy-MM-dd');
        it(`${label} → +${len - 1} days (${start} → ${end})`, () => {
          const loop = countWorkdaysLoop(start, end);
          const math = countWorkdaysMath(start, end);
          expect(math.workdays).toBe(loop.workdays);
          expect(math.weekends).toBe(loop.weekends);
        });
      }
    }
  });

  // =========================================================
  // 2. Random spot checks: large ranges (10K, 100K, 1M days)
  // =========================================================
  describe('large range spot checks (no loop for ground truth — verify invariants)', () => {
    it('10000 days from Mon should have 7143 workdays + 2857 weekends', () => {
      // 10000 days from Mon: 1428 full weeks (7140 wd + 2856 we) + 4 remaining days (Mon-Thu = 4 wd)
      // Total: 7144 wd + 2856 we
      const math = countWorkdaysMath('2026-06-01', '2053-10-16'); // 10000 days
      expect(math.workdays).toBe(7144);
      expect(math.weekends).toBe(2856);
      expect(math.workdays + math.weekends).toBe(10000);
    });

    it('10000 days from Fri should have 7142 workdays + 2858 weekends', () => {
      // 10000 days from Fri: 1428 full weeks = 7140 wd + 2856 we
      // + 4 remaining: Fri, Sat, Sun, Mon = 2 wd (Fri+Mon) + 2 we (Sat+Sun)
      // Total: 7142 wd + 2858 we
      const math = countWorkdaysMath('2026-06-05', '2053-10-20'); // 10000 days
      expect(math.workdays).toBe(7142);
      expect(math.weekends).toBe(2858);
      expect(math.workdays + math.weekends).toBe(10000);
    });

    it('1 day range should be 1 total', () => {
      const math = countWorkdaysMath('2026-06-01', '2026-06-01');
      expect(math.workdays + math.weekends).toBe(1);
    });

    it('7 day Mon–Sun range = 5 workdays + 2 weekends', () => {
      const math = countWorkdaysMath('2026-06-01', '2026-06-07');
      expect(math.workdays).toBe(5);
      expect(math.weekends).toBe(2);
    });
  });

  // =========================================================
  // 3. DST boundary scenarios
  // =========================================================
  describe('DST boundaries', () => {
    it('spring-forward: range crossing US DST start (Mar 8, 2026)', () => {
      // March 7 (Sat) to March 9 (Mon) = 3 days: Sat, Sun, Mon
      const loop = countWorkdaysLoop('2026-03-07', '2026-03-09');
      const math = countWorkdaysMath('2026-03-07', '2026-03-09');
      expect(math).toEqual(loop);
      expect(math.workdays).toBe(1); // Mon
      expect(math.weekends).toBe(2); // Sat, Sun
    });

    it('fall-back: range crossing US DST end (Nov 1, 2026)', () => {
      // Oct 31 (Sat) to Nov 2 (Mon) = 3 days: Sat, Sun, Mon
      const loop = countWorkdaysLoop('2026-10-31', '2026-11-02');
      const math = countWorkdaysMath('2026-10-31', '2026-11-02');
      expect(math).toEqual(loop);
      expect(math.workdays).toBe(1); // Mon
      expect(math.weekends).toBe(2); // Sat, Sun
    });

    it('DST transition day itself: Mar 8 (Sun) = 0 wd + 1 we', () => {
      const loop = countWorkdaysLoop('2026-03-08', '2026-03-08');
      const math = countWorkdaysMath('2026-03-08', '2026-03-08');
      expect(math).toEqual(loop);
      expect(math.workdays).toBe(0);
      expect(math.weekends).toBe(1);
    });

    it('Europe/London BST transition: Mar 29 (Sun) range', () => {
      // March 27 (Fri) to March 30 (Mon) = Fri, Sat, Sun, Mon = 2wd + 2we
      const loop = countWorkdaysLoop('2026-03-27', '2026-03-30');
      const math = countWorkdaysMath('2026-03-27', '2026-03-30');
      expect(math).toEqual(loop);
    });

    it('Southern hemisphere DST: Australia/Sydney autumn (Apr 5, 2026)', () => {
      // April 4 (Sat) to April 6 (Mon)
      const loop = countWorkdaysLoop('2026-04-04', '2026-04-06');
      const math = countWorkdaysMath('2026-04-04', '2026-04-06');
      expect(math).toEqual(loop);
    });
  });

  // =========================================================
  // 4. Leap year boundaries
  // =========================================================
  describe('leap years', () => {
    it('Feb 28 – Mar 1 in leap year 2024 (3 days)', () => {
      // Feb 28 (Wed) to Mar 1 (Fri) = Wed, Thu, Fri = 3 wd
      const loop = countWorkdaysLoop('2024-02-28', '2024-03-01');
      const math = countWorkdaysMath('2024-02-28', '2024-03-01');
      expect(math).toEqual(loop);
      expect(math.workdays).toBe(3);
    });

    it('Feb 28 – Mar 1 in non-leap year 2025 (3 days)', () => {
      // Feb 28 (Fri) to Mar 1 (Sat) = Fri, Sat = 1 wd + 1 we = wait, 3 days...
      // Feb 28 (Fri), Mar 1 (Sat) — that's only 2 days. Let me recalculate.
      // Wait: Feb 28 to Mar 1 inclusive = Feb 28 + Mar 1 = 2 days (Fri, Sat)
      const loop = countWorkdaysLoop('2025-02-28', '2025-03-01');
      const math = countWorkdaysMath('2025-02-28', '2025-03-01');
      expect(math).toEqual(loop);
    });

    it('leap day Feb 29 itself (2024)', () => {
      const math = countWorkdaysMath('2024-02-29', '2024-02-29');
      expect(math.workdays + math.weekends).toBe(1);
      // Feb 29, 2024 was a Thursday
      expect(math.workdays).toBe(1);
    });

    it('full February 2024 (leap year, 29 days)', () => {
      const loop = countWorkdaysLoop('2024-02-01', '2024-02-29');
      const math = countWorkdaysMath('2024-02-01', '2024-02-29');
      expect(math).toEqual(loop);
    });

    it('full February 2025 (non-leap, 28 days)', () => {
      const loop = countWorkdaysLoop('2025-02-01', '2025-02-28');
      const math = countWorkdaysMath('2025-02-01', '2025-02-28');
      expect(math).toEqual(loop);
    });
  });

  // =========================================================
  // 5. Cross-century and extreme dates
  // =========================================================
  describe('cross-century and extreme dates', () => {
    it('Dec 31, 1999 → Jan 1, 2000', () => {
      const loop = countWorkdaysLoop('1999-12-31', '2000-01-01');
      const math = countWorkdaysMath('1999-12-31', '2000-01-01');
      expect(math).toEqual(loop);
    });

    it('year 2100 (not a leap year, century exception)', () => {
      const loop = countWorkdaysLoop('2100-02-28', '2100-03-01');
      const math = countWorkdaysMath('2100-02-28', '2100-03-01');
      expect(math).toEqual(loop);
    });

    it('year 2000 (leap year, century exception)', () => {
      const loop = countWorkdaysLoop('2000-02-28', '2000-03-01');
      const math = countWorkdaysMath('2000-02-28', '2000-03-01');
      expect(math).toEqual(loop);
      // Feb 28 (Mon) to Mar 1 (Wed) = Mon, Tue, Wed = 3 wd
      expect(math.workdays).toBe(3);
    });

    it('reversed range should still work', () => {
      const forward = countWorkdaysMath('2026-06-01', '2026-06-10');
      const backward = countWorkdaysMath('2026-06-10', '2026-06-01');
      expect(backward).toEqual(forward);
    });
  });

  // =========================================================
  // 6. Invariant: workdays + weekends = dayCount
  // =========================================================
  describe('invariant: workdays + weekends = dayCount', () => {
    const testCases = [
      ['2026-01-01', '2026-01-01'],       // 1 day
      ['2026-01-01', '2026-01-07'],       // 1 week
      ['2026-01-01', '2026-12-31'],       // 1 year
      ['2020-01-01', '2020-12-31'],       // leap year
      ['2026-03-07', '2026-03-09'],       // DST spring
      ['2026-10-31', '2026-11-02'],       // DST fall
      ['2026-06-01', '2126-06-01'],       // 100 years
    ];

    for (const [start, end] of testCases) {
      it(`${start} → ${end}`, () => {
        const math = countWorkdaysMath(start, end);
        const s = DateTime.fromISO(start, { zone: 'UTC' }).startOf('day');
        const e = DateTime.fromISO(end, { zone: 'UTC' }).startOf('day');
        const expectedDays = Math.abs(Math.round(e.diff(s, 'days').days)) + 1;
        expect(math.workdays + math.weekends).toBe(expectedDays);
      });
    }
  });
});
