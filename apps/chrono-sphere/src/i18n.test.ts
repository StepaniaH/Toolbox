import { describe, it, expect } from 'vitest';
import { translate, zhTranslations, enTranslations } from './i18n';

describe('chrono-sphere i18n — @toolbox/i18n core integration', () => {
  it('returns the app title for both locales', () => {
    expect(translate('zh', 'app.title')).toBe('ChronoSphere');
    expect(translate('en', 'app.title')).toBe('ChronoSphere');
  });

  it('interpolates a single {{var}} placeholder', () => {
    const zh = translate('zh', 'dst.shiftForward', { hours: 1 });
    expect(zh).toContain('1 小时');
    expect(zh).not.toContain('{{hours}}');
    const en = translate('en', 'dst.shiftForward', { hours: 2 });
    expect(en).toContain('2 hour(s)');
    expect(en).not.toContain('{{hours}}');
  });

  it('interpolates multiple {{var}} placeholders', () => {
    const zh = translate('zh', 'interval.hoursUnit', { days: 3, hours: 4 });
    expect(zh).toBe('天 3 小时 4');
    const en = translate('en', 'interval.hoursUnit', { days: 3, hours: 4 });
    expect(en).toBe('3 days 4 hours');
  });

  it('preserves lunar / solar-term (节气) terminology', () => {
    expect(translate('zh', 'lunar.jieQiLabel')).toBe('节气');
    expect(translate('en', 'lunar.jieQiLabel')).toBe('Solar term');
    expect(translate('zh', 'lunar.ganzhi')).toBe('干支生肖');
    expect(translate('zh', 'lunar.auspicious')).toBe('宜');
    expect(translate('zh', 'lunar.inauspicious')).toBe('忌');
  });

  it('preserves timezone group labels', () => {
    expect(translate('zh', 'timezone.groups.utc')).toBe('协调世界时');
    expect(translate('en', 'timezone.groups.utc')).toBe('Coordinated Universal Time');
    expect(translate('zh', 'timezone.groups.commonAsia')).toBe('常用与亚洲');
    expect(translate('en', 'timezone.groups.commonAsia')).toBe('Common & Asia');
  });

  it('preserves DST auditor strings with interpolation', () => {
    expect(translate('zh', 'dst.title')).toBe('夏令时变更审计 (DST Auditor)');
    expect(translate('en', 'dst.title')).toBe('DST transition audit');
    const detected = translate('en', 'dst.detectedCount', { count: 2 });
    expect(detected).toBe('Detected 2 DST transition events in the selected range:');
  });

  it('returns the key itself for a missing key (graceful fallback)', () => {
    expect(translate('zh', 'no.such.key')).toBe('no.such.key');
    expect(translate('en', 'also.missing')).toBe('also.missing');
  });

  it('zhTranslations and enTranslations expose the same leaf keys', () => {
    const collectLeaves = (node: unknown, prefix: string, acc: string[]): void => {
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
          collectLeaves(value, prefix ? `${prefix}.${key}` : key, acc);
        }
      } else {
        acc.push(prefix);
      }
    };

    const zhLeaves: string[] = [];
    const enLeaves: string[] = [];
    collectLeaves(zhTranslations, '', zhLeaves);
    collectLeaves(enTranslations, '', enLeaves);

    expect(new Set(zhLeaves)).toEqual(new Set(enLeaves));
  });
});
