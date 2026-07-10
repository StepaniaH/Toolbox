import { DateTime } from 'luxon';
import { Solar, Lunar } from 'lunar-javascript';
import { translate, type Locale } from '../i18n';

export interface LunarResult {
  lunarStr: string;
  yearGanZhi: string;
  shengXiao: string;
  monthName: string;
  dayName: string;
  jieQi: string;
  festivals: string[];
  yi: string[];
  ji: string[];
}

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

/**
 * Get Chinese Lunar details for a Gregorian date
 */
export function getLunarDetails(dateStr: string, zone: string): LunarResult | null {
  try {
    const dt = DateTime.fromISO(dateStr, { zone });
    if (!dt.isValid) return null;

    // Create local Date object
    const jsDate = new Date(dt.year, dt.month - 1, dt.day);
    const solar = Solar.fromDate(jsDate);
    const lunar = solar.getLunar();

    return {
      lunarStr: lunar.toString(),
      yearGanZhi: lunar.getYearInGanZhi(),
      shengXiao: lunar.getYearShengXiao(),
      monthName: lunar.getMonthInChinese() + '月',
      dayName: lunar.getDayInChinese(),
      jieQi: lunar.getJieQi() || '',
      festivals: [...lunar.getFestivals(), ...solar.getFestivals()],
      yi: lunar.getDayYi() || [],
      ji: lunar.getDayJi() || [],
    };
  } catch (e) {
    console.error('Error fetching lunar details:', e);
    return null;
  }
}

/**
 * Convert Lunar date to Gregorian Date string (yyyy-MM-dd)
 */
export function convertLunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeap: boolean,
  locale: Locale = 'zh',
): { success: boolean; dateStr?: string; error?: string } {
  try {
    const lunar = Lunar.fromYmd(year, isLeap ? -month : month, day);
    const solar = lunar.getSolar();

    return {
      success: true,
      dateStr: solar.toYmd(),
    };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) || translate(locale, 'lunar.invalidLunar') };
  }
}
