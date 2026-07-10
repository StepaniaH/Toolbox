import React, { useMemo, useState } from 'react';
import { Calendar, Plus, CalendarRange } from 'lucide-react';
import { calculateOffset, detectDstTransitions, getLunarDetails, getZoneShortLabel } from '../utils/dateUtils';
import type { DateResult, DstTransition } from '../utils/dateUtils';
import { TimezoneSelect } from './TimezoneSelect';
import { DstAuditor } from './DstAuditor';
import { RangeVisualizer } from './RangeVisualizer';
import { DateTime } from 'luxon';
import { useTranslation } from '@toolbox/i18n/react';

export const OffsetCalculator: React.FC = () => {
  const { lang, t } = useTranslation();
  // Initialize timezone state locally to browser's default or Asia/Shanghai
  const [zone, setZone] = useState(() => {
    try {
      return DateTime.local().zoneName || 'Asia/Shanghai';
    } catch {
      return 'Asia/Shanghai';
    }
  });

  const getTodayStr = (tz: string) => DateTime.now().setZone(tz).toFormat('yyyy-MM-dd');

  const [startDate, setStartDate] = useState(() => getTodayStr(zone));
  const [offsetStr, setOffsetStr] = useState('10');
  const [mode, setMode] = useState<'thDay' | 'interval'>('interval');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const offset = parseInt(offsetStr, 10);
  const signedOffset = direction === 'backward' ? -Math.abs(offset) : Math.abs(offset);
  
  const { result, transitions, error } = useMemo<{
    result: DateResult | null;
    transitions: DstTransition[];
    error: string | null;
  }>(() => {
    if (!startDate) {
      return { result: null, transitions: [], error: null };
    }

    if (isNaN(signedOffset)) {
      return { result: null, transitions: [], error: t('offset.invalidNumber') };
    }

    const calc = calculateOffset(startDate, signedOffset, mode, zone, lang);
    if (calc.success && calc.result) {
      const dst = detectDstTransitions(startDate, calc.result.dateStr, zone, lang);
      return { result: calc.result, transitions: dst, error: null };
    }

    return { result: null, transitions: [], error: calc.error || t('offset.invalidCalculation') };
  }, [startDate, signedOffset, mode, zone, lang, t]);

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOffsetStr(e.target.value);
  };

  const visualizerTotalDays = useMemo(() => {
    if (isNaN(signedOffset)) return 0;
    const inclusive = Math.abs(signedOffset) + (mode === 'interval' ? 1 : 0);
    return signedOffset >= 0 ? inclusive : -inclusive;
  }, [signedOffset, mode]);

  return (
    <div className="calculator-grid fade-in">
      {/* Form controls */}
      <div className="form-section">
        <div className="form-group">
          <label className="form-label">{t('offset.baseZone')}</label>
          <TimezoneSelect value={zone} onChange={setZone} />
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.startDate')}</label>
          <div className="input-icon-wrapper">
            <Calendar className="input-icon" size={18} />
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          {startDate && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '4px', marginTop: '2px' }}>
              {(() => {
                const details = getLunarDetails(startDate, zone);
                return details ? `${t('offset.lunarTitle')}：${details.lunarStr} (${details.yearGanZhi} · ${details.shengXiao})` : '';
              })()}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.mode')}</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${mode === 'interval' ? 'active' : ''}`}
              onClick={() => setMode('interval')}
            >
              {direction === 'forward'
                ? t('offset.intervalMode')
                : t('offset.intervalModeBackward')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${mode === 'thDay' ? 'active' : ''}`}
              onClick={() => setMode('thDay')}
            >
              {direction === 'forward'
                ? t('offset.thDayMode')
                : t('offset.thDayModeBackward')}
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
            {mode === 'interval'
              ? (direction === 'forward' ? t('offset.intervalHelp') : t('offset.intervalHelpBackward'))
              : (direction === 'forward' ? t('offset.thDayHelp') : t('offset.thDayHelpBackward'))}
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.direction')}</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${direction === 'forward' ? 'active' : ''}`}
              onClick={() => setDirection('forward')}
            >
              {t('offset.forward')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${direction === 'backward' ? 'active' : ''}`}
              onClick={() => setDirection('backward')}
            >
              {t('offset.backward')}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.amount')}</label>
          <div className="input-icon-wrapper">
            <Plus className="input-icon" size={18} />
            <input
              type="number"
              className="form-input"
              placeholder={t('offset.amountPlaceholder')}
              value={offsetStr}
              onChange={handleOffsetChange}
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Results panel */}
      <div className="results-section">
        {error ? (
          <div className="results-placeholder" style={{ color: 'var(--color-error)' }}>
            <p>{error}</p>
          </div>
        ) : !result ? (
          <div className="results-placeholder">
            <CalendarRange className="placeholder-icon" size={48} />
            <p>{t('offset.placeholder')}</p>
          </div>
        ) : (
          <div className="results-content">
            <div>
              <div className="result-card-heading">{t('offset.resultTitle')}</div>
              <div style={{ marginTop: '15px' }}>
                <div className="big-date-display">{result.dateStr}</div>
                <div className="date-meta-info">
                  <span className="meta-pill">{result.weekday}</span>
                  <span className="meta-pill">UTC{result.offsetHours >= 0 ? `+${result.offsetHours}` : result.offsetHours} ({result.offsetName})</span>
                  {result.isDst && <span className="meta-pill dst-active">{t('offset.dstActive')}</span>}
                </div>
                {(() => {
                  const details = getLunarDetails(result.dateStr, zone);
                  if (!details) return null;
                  return (
                    <div className="offset-lunar-display">
                      <div className="offset-lunar-title">
                        {t('offset.lunarTitle')} {details.lunarStr}
                      </div>
                      <div className="offset-lunar-pills">
                        <span className="meta-pill">{details.yearGanZhi}</span>
                        <span className="meta-pill">{t('lunar.zodiacLabel')}{details.shengXiao}</span>
                        {details.jieQi && (
                          <span className="meta-pill jieqi">
                            {details.jieQi}
                          </span>
                        )}
                        {details.festivals.map(f => (
                          <span key={f} className="meta-pill festival">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <RangeVisualizer 
              startDateStr={startDate} 
              endDateStr={result.dateStr} 
              totalDays={visualizerTotalDays} 
              startZone={zone}
              endZone={zone}
              locale={lang}
            />

            <DstAuditor transitions={transitions} zone={zone} zoneLabel={getZoneShortLabel(zone, lang)} />
          </div>
        )}
      </div>
    </div>
  );
};
