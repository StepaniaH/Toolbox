import React from 'react';
import { Calendar, Clock, Sparkles, Activity } from 'lucide-react';
import { DateTime } from 'luxon';
import { getLunarDetails, detectDstTransitions } from '../utils/dateUtils';
import { translate, type Locale } from '../i18n';

interface RangeVisualizerProps {
  startDateStr: string;
  endDateStr: string;
  totalDays: number;
  startZone?: string;
  endZone?: string;
  locale?: Locale;
}

interface TimelineMarker {
  key: string;
  dateStr: string;
  percent: number;
  label: string;
  type: 'dst' | 'holiday' | 'jieqi';
}

export const RangeVisualizer: React.FC<RangeVisualizerProps> = ({
  startDateStr,
  endDateStr,
  totalDays,
  startZone = 'UTC',
  endZone = 'UTC',
  locale = 'zh',
}) => {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const absDays = Math.abs(totalDays);
  const isNegative = totalDays < 0;

  const startISO = isNegative ? endDateStr : startDateStr;
  const endISO = isNegative ? startDateStr : endDateStr;
  const zoneStart = isNegative ? endZone : startZone;
  const zoneEnd = isNegative ? startZone : endZone;

  let workdays = 0;
  let weekends = 0;

  try {
    const startUtc = DateTime.fromISO(startISO, { zone: 'UTC' }).startOf('day');
    const endUtc = DateTime.fromISO(endISO, { zone: 'UTC' }).startOf('day');

    if (startUtc.isValid && endUtc.isValid) {
      const dayCount = Math.round(endUtc.diff(startUtc, 'days').days) + 1; // inclusive
      const startWd = startUtc.weekday; // 1=Mon … 7=Sun

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
  } catch (error) {
    console.error('Ratio calculation failed:', error);
  }

  const totalSegmentDays = workdays + weekends || 1;
  const workdayPercent = (workdays / totalSegmentDays) * 100;
  const weekendPercent = (weekends / totalSegmentDays) * 100;

  const markers: TimelineMarker[] = [];

  if (absDays > 0 && absDays <= 90) {
    try {
      const dtStart = DateTime.fromISO(startISO, { zone: zoneStart }).startOf('day');
      const dtEnd = DateTime.fromISO(endISO, { zone: zoneEnd }).startOf('day');
      const totalHoursDiff = Math.abs(dtEnd.diff(dtStart, 'hours').hours) || 24;

      const dstTransitions = detectDstTransitions(startISO, endISO, zoneStart, locale);
      if (zoneStart !== zoneEnd) {
        dstTransitions.push(...detectDstTransitions(startISO, endISO, zoneEnd, locale));
      }

      const seenDates = new Set<string>();
      dstTransitions.forEach((transition) => {
        if (seenDates.has(transition.date)) return;
        seenDates.add(transition.date);

        const dtMarker = DateTime.fromISO(transition.date, { zone: zoneStart });
        const hoursPassed = dtMarker.diff(dtStart, 'hours').hours;
        let percent = (hoursPassed / totalHoursDiff) * 100;
        percent = Math.max(3, Math.min(97, percent));

        markers.push({
          key: `dst-${transition.date}`,
          dateStr: transition.date,
          percent,
          label: t('visualizer.dst'),
          type: 'dst',
        });
      });

      let current = dtStart;
      let stepCount = 0;
      while (current <= dtEnd && stepCount < 100) {
        stepCount++;
        const currISO = current.toFormat('yyyy-MM-dd');
        const lunar = getLunarDetails(currISO, zoneStart);

        if (lunar) {
          const hoursPassed = current.diff(dtStart, 'hours').hours;
          let percent = (hoursPassed / totalHoursDiff) * 100;
          percent = Math.max(3, Math.min(97, percent));

          if (lunar.jieQi) {
            markers.push({
              key: `jieqi-${currISO}`,
              dateStr: currISO,
              percent,
              label: lunar.jieQi,
              type: 'jieqi',
            });
          }

          if (lunar.festivals && lunar.festivals.length > 0) {
            const mainFestival = lunar.festivals[0];
            markers.push({
              key: `holiday-${currISO}`,
              dateStr: currISO,
              percent,
              label: mainFestival.substring(0, 4),
              type: 'holiday',
            });
          }
        }
        current = current.plus({ days: 1 });
      }
    } catch (error) {
      console.error('Timeline scanning failed:', error);
    }
  }

  const sortedMarkers = markers.sort((a, b) => a.percent - b.percent);
  const visibleMarkers: TimelineMarker[] = [];
  let lastPercent = -20;

  sortedMarkers.forEach((marker) => {
    if (marker.percent - lastPercent >= 8) {
      visibleMarkers.push(marker);
      lastPercent = marker.percent;
    }
  });

  const zoneLabel = (zone: string) => {
    if (zone === 'UTC') return 'UTC';
    return zone.split('/').pop()?.replaceAll('_', ' ') || zone;
  };

  return (
    <div className="range-visualizer fade-in">
      <div className="visualizer-header-row">
        <Activity size={14} />
        <span className="result-card-heading" style={{ border: 'none', padding: 0, margin: 0, fontSize: '0.82rem' }}>{t('visualizer.title')}</span>
      </div>

      <div>
        <div className="ratio-stats-row">
          <span>
            {t('visualizer.workdayShare')}：{Math.round(workdayPercent)}% ({workdays}{t('interval.totalDaysUnit')})
          </span>
          <span>
            {t('visualizer.weekendShare')}：{Math.round(weekendPercent)}% ({weekends}{t('interval.totalDaysUnit')})
          </span>
        </div>
        <div className="workday-ratio-bar">
          {workdays > 0 && (
            <div
              className="workday-ratio-fill"
              style={{ width: `${workdayPercent}%` }}
            />
          )}
          {weekends > 0 && (
            <div
              className="weekend-ratio-fill"
              style={{ width: `${weekendPercent}%` }}
            />
          )}
        </div>
      </div>

      <div style={{ padding: '0 10px', marginTop: '5px' }}>
        <div className="timeline-track">
          <div className="timeline-progress" style={{ width: '100%', left: '0%' }} />
          <div className="timeline-node start" style={{ left: '0%' }} />

          {visibleMarkers.map((marker) => (
            <div
              key={marker.key}
              className="timeline-marker-wrapper"
              style={{ left: `${marker.percent}%` }}
            >
              <div className={`timeline-marker-dot ${marker.type}`} />
              <div
                className="timeline-marker-label"
              >
                {marker.type === 'dst' && <Clock size={10} style={{ color: 'var(--color-warning)' }} />}
                {marker.type === 'holiday' && <Sparkles size={10} style={{ color: 'var(--accent-secondary)' }} />}
                {marker.type === 'jieqi' && <Calendar size={10} style={{ color: 'var(--color-success)' }} />}
                <span>{marker.label}</span>
              </div>
            </div>
          ))}

          <div className="timeline-node end" style={{ left: '100%' }} />
        </div>

        <div className="timeline-labels" style={{ marginTop: '16px' }}>
          <div className="timeline-label-left">
            <div className="timeline-label-date">{startDateStr}</div>
            <div className="timeline-label-meta">
              {t('visualizer.start')} {zoneStart !== 'UTC' && `(${zoneLabel(zoneStart)})`}
            </div>
          </div>

          <div className="timeline-label-center">
            <div className="visualizer-span-badge">
              {totalDays < 0 ? t('visualizer.reversing', { days: absDays }) : t('visualizer.spanning', { days: absDays })}
            </div>
          </div>

          <div className="timeline-label-right">
            <div className="timeline-label-date">{endDateStr}</div>
            <div className="timeline-label-meta">
              {t('visualizer.end')} {endZone !== 'UTC' && `(${zoneLabel(endZone)})`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
