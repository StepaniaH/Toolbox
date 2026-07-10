import { DateTime } from 'luxon';
import { translate, type Locale } from '../i18n';
import { formatUtcOffset } from './timezone';

export interface DateResult {
  dateStr: string;
  weekday: string;
  isDst: boolean;
  offsetName: string;
  offsetHours: number;
}

export interface DstTransition {
  date: string;
  type: 'forward' | 'backward';
  fromOffsetName: string;
  toOffsetName: string;
  shiftMinutes: number;
  description: string;
}

export interface IntervalResult {
  totalDays: number;
  workdays: number;
  weekends: number;
  isNegative: boolean;
  actualStart: DateResult;
  actualEnd: DateResult;
  absoluteDays: number;
  absoluteHours: number;
}

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

function getDateResult(dt: DateTime, locale: Locale): DateResult {
  return {
    dateStr: dt.toFormat('yyyy-MM-dd'),
    weekday: dt.setLocale(locale === 'en' ? 'en-US' : 'zh-CN').toFormat('cccc'),
    isDst: dt.isInDST,
    offsetName: dt.offsetNameShort || formatUtcOffset(dt.offset),
    offsetHours: dt.offset / 60,
  };
}

/**
 * Calculate target date from start date by offset days
 * @param startDateStr 'yyyy-MM-dd'
 * @param offset X days
 * @param mode 'thDay' (第 X 日) or 'interval' (间隔 X 日)
 * @param zone Timezone name
 */
export function calculateOffset(
  startDateStr: string,
  offset: number,
  mode: 'thDay' | 'interval',
  zone: string,
  locale: Locale = 'zh',
): { success: boolean; result?: DateResult; error?: string } {
  try {
    const start = DateTime.fromISO(startDateStr, { zone });
    if (!start.isValid) {
      return { success: false, error: translate(locale, 'offset.invalidDate') };
    }

    let target: DateTime;
    if (mode === 'thDay') {
      if (Math.abs(offset) < 1) {
        return { success: false, error: translate(locale, 'offset.thDayMinimum') };
      }
      const sign = offset >= 0 ? 1 : -1;
      target = start.plus({ days: offset - sign });
    } else {
      target = start.plus({ days: offset });
    }

    return {
      success: true,
      result: getDateResult(target, locale),
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || translate(locale, 'offset.invalidCalculation') };
  }
}

/**
 * Calculate the interval between two dates with dual timezone support
 * @param startDateStr 'yyyy-MM-dd'
 * @param endDateStr 'yyyy-MM-dd'
 * @param inclusion 'both' | 'start' | 'end' | 'exclude'
 * @param startZone Timezone name for start date
 * @param endZone Timezone name for end date
 */
export function calculateInterval(
  startDateStr: string,
  endDateStr: string,
  inclusion: 'both' | 'start' | 'end' | 'exclude',
  startZone: string,
  endZone: string,
  locale: Locale = 'zh',
): { success: boolean; result?: IntervalResult; error?: string } {
  try {
    const startLocal = DateTime.fromISO(startDateStr, { zone: startZone });
    const endLocal = DateTime.fromISO(endDateStr, { zone: endZone });

    if (!startLocal.isValid || !endLocal.isValid) {
      return { success: false, error: translate(locale, 'interval.errorPlaceholder') };
    }

    // 1. Local Calendar Day Difference
    const startUtc = DateTime.fromISO(startDateStr, { zone: 'UTC' }).startOf('day');
    const endUtc = DateTime.fromISO(endDateStr, { zone: 'UTC' }).startOf('day');
    const diffDays = Math.round(endUtc.diff(startUtc, 'days').days);

    const isNegative = diffDays < 0;
    const absDiffDays = Math.abs(diffDays);

    let totalDays = 0;
    if (inclusion === 'both') {
      totalDays = absDiffDays + 1;
    } else if (inclusion === 'start' || inclusion === 'end') {
      totalDays = absDiffDays;
    } else {
      totalDays = Math.max(0, absDiffDays - 1);
    }

    // 2. Workdays and Weekends
    let workdays = 0;
    let weekends = 0;

    if (totalDays > 0) {
      let checkStart = startUtc;
      let checkEnd = endUtc;

      if (isNegative) {
        checkStart = endUtc;
        checkEnd = startUtc;
      }

      if (inclusion === 'start') {
        checkEnd = checkEnd.minus({ days: 1 });
      } else if (inclusion === 'end') {
        checkStart = checkStart.plus({ days: 1 });
      } else if (inclusion === 'exclude') {
        checkStart = checkStart.plus({ days: 1 });
        checkEnd = checkEnd.minus({ days: 1 });
      }

      if (checkStart <= checkEnd) {
        const dayCount = Math.round(checkEnd.diff(checkStart, 'days').days) + 1; // inclusive
        const startWd = checkStart.weekday; // 1=Mon … 7=Sun

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
    }

    // 3. Absolute Elapsed Time
    const startInstant = startLocal.startOf('day');
    const endInstant = endLocal.startOf('day');
    const diffHoursAbs = endInstant.diff(startInstant, 'hours').hours;

    const absoluteTotalHours = Math.abs(diffHoursAbs);
    const absoluteDays = Math.floor(absoluteTotalHours / 24);
    const absoluteHours = Math.round(absoluteTotalHours % 24);

    return {
      success: true,
      result: {
        totalDays: isNegative ? -totalDays : totalDays,
        workdays,
        weekends,
        isNegative,
        actualStart: getDateResult(startLocal.startOf('day'), locale),
        actualEnd: getDateResult(endLocal.startOf('day'), locale),
        absoluteDays,
        absoluteHours,
      }
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || translate(locale, 'interval.invalid') };
  }
}

/**
 * Scan a date range in a timezone for DST transitions
 */
export function detectDstTransitions(
  startDateStr: string,
  endDateStr: string,
  zone: string,
  locale: Locale = 'zh',
): DstTransition[] {
  const transitions: DstTransition[] = [];
  try {
    let start = DateTime.fromISO(startDateStr, { zone }).set({ hour: 12 });
    let end = DateTime.fromISO(endDateStr, { zone }).set({ hour: 12 });

    if (!start.isValid || !end.isValid) {
      return [];
    }

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    const diffYears = end.diff(start, 'years').years;
    if (diffYears > 10) {
      end = start.plus({ years: 10 });
    }

    let current = start;
    let prevOffset = current.offset;
    let prevOffsetName = current.offsetNameShort || '';

    current = current.plus({ days: 1 });
    while (current <= end.plus({ days: 1 })) {
      const currOffset = current.offset;
      const currOffsetName = current.offsetNameShort || '';

      if (currOffset !== prevOffset) {
        const shiftMinutes = currOffset - prevOffset;
        const shiftHours = Math.abs(shiftMinutes / 60);
        const isForward = shiftMinutes > 0;

        const dateStr = current.toFormat('yyyy-MM-dd');
        const description = isForward
          ? translate(locale, 'dst.shiftForward', { hours: shiftHours })
          : translate(locale, 'dst.shiftBackward', { hours: shiftHours });

        transitions.push({
          date: dateStr,
          type: isForward ? 'forward' : 'backward',
          fromOffsetName: prevOffsetName || formatUtcOffset(prevOffset),
          toOffsetName: currOffsetName || formatUtcOffset(currOffset),
          shiftMinutes,
          description,
        });
      }

      prevOffset = currOffset;
      prevOffsetName = currOffsetName;
      current = current.plus({ days: 1 });
    }
  } catch (e) {
    console.error('Error detecting DST transitions:', e);
  }

  const seenDates = new Set<string>();
  return transitions.filter(t => {
    if (seenDates.has(t.date)) return false;
    seenDates.add(t.date);
    return true;
  });
}
