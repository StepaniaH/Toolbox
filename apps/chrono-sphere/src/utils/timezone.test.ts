import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  formatUtcOffset,
  getAvailableTimezones,
  getFriendlyZoneLabel,
  getZoneShortLabel,
} from './timezone';

describe('getAvailableTimezones — list integrity', () => {
  it('should return a non-empty list for zh', () => {
    const list = getAvailableTimezones('zh');
    expect(list.length).toBeGreaterThan(0);
  });

  it('should return a non-empty list for en', () => {
    const list = getAvailableTimezones('en');
    expect(list.length).toBeGreaterThan(0);
  });

  it('should produce equal-length lists across locales (same database)', () => {
    const zh = getAvailableTimezones('zh');
    const en = getAvailableTimezones('en');
    expect(zh.length).toBe(en.length);
  });

  it('should populate every entry with the required fields', () => {
    const list = getAvailableTimezones('en');
    for (const tz of list) {
      expect(typeof tz.value).toBe('string');
      expect(tz.value.length).toBeGreaterThan(0);
      expect(typeof tz.label).toBe('string');
      expect(tz.label.length).toBeGreaterThan(0);
      expect(typeof tz.country).toBe('string');
      expect(typeof tz.city).toBe('string');
      expect(typeof tz.group).toBe('string');
      expect(typeof tz.searchText).toBe('string');
      // searchText is lowercased for case-insensitive search
      expect(tz.searchText).toBe(tz.searchText.toLowerCase());
    }
  });

  it('should include canonical zones (UTC, Asia/Shanghai, America/New_York)', () => {
    const list = getAvailableTimezones('en');
    const values = list.map((t) => t.value);
    expect(values).toContain('UTC');
    expect(values).toContain('Asia/Shanghai');
    expect(values).toContain('America/New_York');
  });

  it('should contain a UTC offset token in every label', () => {
    const list = getAvailableTimezones('en');
    for (const tz of list) {
      expect(tz.label).toMatch(/UTC[+-]\d{2}:\d{2}|UTC/);
    }
  });
});

describe('formatUtcOffset — positive and negative offsets', () => {
  it('positive whole-hour offset (UTC+8 = 480 min)', () => {
    expect(formatUtcOffset(480)).toBe('UTC+08:00');
  });

  it('zero offset', () => {
    expect(formatUtcOffset(0)).toBe('UTC+00:00');
  });

  it('negative whole-hour offset (UTC-5 = -300 min)', () => {
    expect(formatUtcOffset(-300)).toBe('UTC-05:00');
  });

  it('negative half-hour offset (UTC-3:30 = -210 min, Newfoundland-style)', () => {
    expect(formatUtcOffset(-210)).toBe('UTC-03:30');
  });

  it('positive half-hour offset (UTC+5:30 = 330 min, India-style)', () => {
    expect(formatUtcOffset(330)).toBe('UTC+05:30');
  });

  it('should zero-pad single-digit hours and minutes', () => {
    expect(formatUtcOffset(60)).toBe('UTC+01:00');
    expect(formatUtcOffset(-60)).toBe('UTC-01:00');
  });

  it('labels for known fixed-offset zones reflect the sign', () => {
    const list = getAvailableTimezones('en');
    const shanghai = list.find((t) => t.value === 'Asia/Shanghai')!;
    const ny = list.find((t) => t.value === 'America/New_York')!;
    // Shanghai is always east of UTC (+); New York is always west of UTC (-)
    expect(shanghai.label).toMatch(/UTC\+/);
    expect(ny.label).toMatch(/UTC-/);
  });
});

describe('DST detection via zone offsets', () => {
  it('America/New_York offset differs between summer (EDT) and winter (EST)', () => {
    const summer = DateTime.fromISO('2026-07-15T12:00:00', { zone: 'America/New_York' });
    const winter = DateTime.fromISO('2026-01-15T12:00:00', { zone: 'America/New_York' });
    expect(summer.offset).not.toBe(winter.offset);
    // EDT = UTC-4 (240 min), EST = UTC-5 (300 min)
    expect(summer.offset).toBe(-240);
    expect(winter.offset).toBe(-300);
    expect(summer.isInDST).toBe(true);
    expect(winter.isInDST).toBe(false);
  });

  it('Asia/Shanghai has no DST — offset is identical year-round', () => {
    const summer = DateTime.fromISO('2026-07-15T12:00:00', { zone: 'Asia/Shanghai' });
    const winter = DateTime.fromISO('2026-01-15T12:00:00', { zone: 'Asia/Shanghai' });
    expect(summer.offset).toBe(winter.offset);
    expect(summer.offset).toBe(480);
    expect(summer.isInDST).toBe(false);
    expect(winter.isInDST).toBe(false);
  });

  it('Europe/London observes DST (GMT in winter, BST in summer)', () => {
    const summer = DateTime.fromISO('2026-07-15T12:00:00', { zone: 'Europe/London' });
    const winter = DateTime.fromISO('2026-01-15T12:00:00', { zone: 'Europe/London' });
    expect(summer.offset).not.toBe(winter.offset);
    expect(winter.offset).toBe(0);   // GMT = UTC+0
    expect(summer.offset).toBe(60);  // BST = UTC+1
    expect(summer.isInDST).toBe(true);
  });

  it('Southern-hemisphere DST is inverted (Sydney: DST in summer = Dec)', () => {
    const dec = DateTime.fromISO('2026-12-15T12:00:00', { zone: 'Australia/Sydney' });
    const jul = DateTime.fromISO('2026-07-15T12:00:00', { zone: 'Australia/Sydney' });
    expect(dec.offset).not.toBe(jul.offset);
    expect(dec.isInDST).toBe(true);
    expect(jul.isInDST).toBe(false);
  });
});

describe('getFriendlyZoneLabel & getZoneShortLabel', () => {
  it('getFriendlyZoneLabel returns a localized, offset-annotated label', () => {
    const zh = getFriendlyZoneLabel('Asia/Shanghai', 'zh');
    expect(zh).toContain('中国');
    expect(zh).toMatch(/UTC\+08:00/);

    const en = getFriendlyZoneLabel('Asia/Shanghai', 'en');
    expect(en).toContain('China');
    expect(en).toMatch(/UTC\+08:00/);
  });

  it('getZoneShortLabel returns country + city without offset', () => {
    const en = getZoneShortLabel('America/New_York', 'en');
    expect(en).toContain('United States');
    expect(en).toContain('New York');
    expect(en).not.toMatch(/UTC[+-]/);
  });

  it('getZoneShortLabel respects locale', () => {
    const zh = getZoneShortLabel('America/New_York', 'zh');
    expect(zh).toContain('美国');
  });

  it('falls back to the raw zone value for an unknown zone', () => {
    expect(getFriendlyZoneLabel('Mars/Olympus', 'zh')).toBe('Mars/Olympus');
    expect(getZoneShortLabel('Mars/Olympus', 'en')).toBe('Mars/Olympus');
  });
});

describe('city data is trilingual (catalog-driven)', () => {
  const ZONES = ['Asia/Shanghai', 'America/New_York', 'Europe/London', 'UTC'];

  it('every zone resolves non-empty country/city in all three locales', () => {
    for (const locale of ['zh', 'zh-Hant', 'en'] as const) {
      for (const tz of getAvailableTimezones(locale)) {
        expect(tz.country.length, `${tz.value}.country (${locale})`).toBeGreaterThan(0);
        expect(tz.city.length, `${tz.value}.city (${locale})`).toBeGreaterThan(0);
      }
    }
  });

  it('zh-Hant renders Traditional labels instead of simplified fallbacks', () => {
    expect(getZoneShortLabel('America/New_York', 'zh-Hant')).toContain('美國');
    expect(getZoneShortLabel('America/New_York', 'zh-Hant')).toContain('紐約');
    expect(getAvailableTimezones('zh-Hant').find((t) => t.value === 'UTC')!.country).toBe('協調世界時');
  });

  it('searchText indexes simplified, traditional and english variants', () => {
    const shanghai = getAvailableTimezones('en').find((t) => t.value === 'Asia/Shanghai')!;
    expect(shanghai.searchText).toContain('中国');
    expect(shanghai.searchText).toContain('中國');
    expect(shanghai.searchText).toContain('china');
  });

  it('all three locales expose the identical zone value set', () => {
    const values = (locale: 'zh' | 'zh-Hant' | 'en') =>
      getAvailableTimezones(locale).map((t) => t.value).join('|');
    expect(values('zh')).toBe(values('en'));
    expect(values('zh')).toBe(values('zh-Hant'));
  });

  it('known zones keep distinct country/city copy per locale', () => {
    for (const value of ZONES) {
      const zh = getAvailableTimezones('zh').find((t) => t.value === value)!;
      const hant = getAvailableTimezones('zh-Hant').find((t) => t.value === value)!;
      const en = getAvailableTimezones('en').find((t) => t.value === value)!;
      expect(hant.label).not.toBe(zh.label);
      expect(en.label).not.toBe(hant.label);
    }
  });
});
