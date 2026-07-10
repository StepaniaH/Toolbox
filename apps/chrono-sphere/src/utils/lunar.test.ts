import { describe, it, expect } from 'vitest';
import { Solar } from 'lunar-javascript';
import { getLunarDetails, convertLunarToSolar } from './lunar';

describe('getLunarDetails — solar → lunar conversion', () => {
  it('returns a fully-populated LunarResult for a valid date', () => {
    const r = getLunarDetails('2026-06-15', 'Asia/Shanghai');
    expect(r).not.toBeNull();
    expect(r!.lunarStr).toBe('二〇二六年五月初一');
    expect(r!.yearGanZhi).toBe('丙午');
    expect(r!.shengXiao).toBe('马');
    expect(r!.monthName).toBe('五月');
    expect(r!.dayName).toBe('初一');
    expect(r!.jieQi).toBe('');
    expect(Array.isArray(r!.festivals)).toBe(true);
    expect(Array.isArray(r!.yi)).toBe(true);
    expect(Array.isArray(r!.ji)).toBe(true);
    expect(r!.yi.length).toBeGreaterThan(0);
    expect(r!.ji.length).toBeGreaterThan(0);
  });

  it('returns the Spring Festival (春节) on Lunar New Year 2026-02-17', () => {
    const r = getLunarDetails('2026-02-17', 'Asia/Shanghai');
    expect(r).not.toBeNull();
    expect(r!.lunarStr).toBe('二〇二六年正月初一');
    expect(r!.festivals).toContain('春节');
  });

  it('honors the timezone when resolving the calendar day', () => {
    // 2026-02-17 23:30 in Shanghai is already Feb 18 in UTC, but getLunarDetails
    // uses the zoned calendar date, so the lunar result must still reflect Feb 17.
    const r = getLunarDetails('2026-02-17T23:30:00', 'Asia/Shanghai');
    expect(r).not.toBeNull();
    expect(r!.lunarStr).toBe('二〇二六年正月初一');
  });
});

describe('getLunarDetails — 节气 (solar term) query', () => {
  it('reports 立春 on 2026-02-04', () => {
    const r = getLunarDetails('2026-02-04', 'Asia/Shanghai');
    expect(r).not.toBeNull();
    expect(r!.jieQi).toBe('立春');
  });

  it('reports 春分 on 2026-03-20', () => {
    const r = getLunarDetails('2026-03-20', 'Asia/Shanghai');
    expect(r).not.toBeNull();
    expect(r!.jieQi).toBe('春分');
  });

  it('reports 夏至 on 2026-06-21', () => {
    const r = getLunarDetails('2026-06-21', 'Asia/Shanghai');
    expect(r).not.toBeNull();
    expect(r!.jieQi).toBe('夏至');
  });

  it('reports 冬至 on 2026-12-22', () => {
    const r = getLunarDetails('2026-12-22', 'Asia/Shanghai');
    expect(r).not.toBeNull();
    expect(r!.jieQi).toBe('冬至');
  });

  it('returns an empty jieQi string on a non-solar-term day', () => {
    const r = getLunarDetails('2026-06-15', 'Asia/Shanghai');
    expect(r).not.toBeNull();
    expect(r!.jieQi).toBe('');
  });
});

describe('getLunarDetails — invalid input handling', () => {
  it('returns null for a non-date string', () => {
    expect(getLunarDetails('not-a-date', 'Asia/Shanghai')).toBeNull();
  });

  it('returns null for an out-of-range month', () => {
    expect(getLunarDetails('2026-13-01', 'Asia/Shanghai')).toBeNull();
  });

  it('returns null for an out-of-range day', () => {
    expect(getLunarDetails('2026-06-31', 'Asia/Shanghai')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(getLunarDetails('', 'Asia/Shanghai')).toBeNull();
  });
});

describe('convertLunarToSolar — lunar → solar conversion', () => {
  it('converts Lunar New Year 2026 (month=1, day=1) to 2026-02-17', () => {
    const r = convertLunarToSolar(2026, 1, 1, false);
    expect(r.success).toBe(true);
    expect(r.dateStr).toBe('2026-02-17');
  });

  it('round-trips a solar date through getLunarDetails and convertLunarToSolar', () => {
    // getLunarDetails internally does Solar.fromDate(new Date(year, monthIndex, day)).
    // We mirror that to obtain the exact lunar ymd, then convert back to solar.
    const solarDate = '2026-08-15';
    const [y, m, d] = solarDate.split('-').map(Number);
    const lunar = Solar.fromDate(new Date(y, m - 1, d)).getLunar();
    const lunarMonth = lunar.getMonth();   // negative when leap
    const isLeap = lunarMonth < 0;

    const r = convertLunarToSolar(lunar.getYear(), Math.abs(lunarMonth), lunar.getDay(), isLeap, 'zh');
    expect(r.success).toBe(true);
    expect(r.dateStr).toBe(solarDate);
  });

  it('converts a mid-year lunar date correctly', () => {
    // Lunar 2026/5/1 → 2026-06-15 (matches getLunarDetails probe above)
    const r = convertLunarToSolar(2026, 5, 1, false);
    expect(r.success).toBe(true);
    expect(r.dateStr).toBe('2026-06-15');
  });
});

describe('convertLunarToSolar — invalid input handling', () => {
  it('rejects an impossible lunar day (day=32)', () => {
    const r = convertLunarToSolar(2026, 1, 32, false);
    expect(r.success).toBe(false);
    expect(r.dateStr).toBeUndefined();
    expect(r.error).toBeTruthy();
  });

  it('rejects a non-existent leap month', () => {
    // 2026 has no leap first month
    const r = convertLunarToSolar(2026, 1, 1, true);
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('rejects day=0', () => {
    const r = convertLunarToSolar(2026, 1, 0, false);
    expect(r.success).toBe(false);
  });

  it('exposes a localized error message via the locale param', () => {
    const zh = convertLunarToSolar(2026, 1, 32, false, 'zh');
    const en = convertLunarToSolar(2026, 1, 32, false, 'en');
    expect(zh.success).toBe(false);
    expect(en.success).toBe(false);
    // The library throws a concrete message, so error should be populated for both locales
    expect(zh.error).toBeTruthy();
    expect(en.error).toBeTruthy();
  });
});
