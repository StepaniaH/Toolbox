import React from 'react';
import { Clock, HelpCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { DstTransition } from '../utils/dateUtils';
import { useTranslation } from '@toolbox/i18n/react';

export interface DstTransitionWithZone extends DstTransition {
  zoneName?: string;
}

interface DstAuditorProps {
  transitions: DstTransitionWithZone[];
  zone: string;
  zoneLabel?: string;
  isDualZone?: boolean;
}

export const DstAuditor: React.FC<DstAuditorProps> = ({ transitions, zone, zoneLabel, isDualZone = false }) => {
  const hasTransitions = transitions.length > 0;
  const { t } = useTranslation();
  const displayZone = zoneLabel || zone;

  return (
    <div className="dst-auditor-card fade-in">
      <div className="dst-auditor-header">
        <Clock size={16} />
        <span>{t('dst.title')}</span>
      </div>

      {!hasTransitions ? (
        <div className="dst-no-transition-text">
          <HelpCircle size={14} className="text-muted" />
          <span>
            {isDualZone
              ? t('dst.noTransitionDual')
              : t('dst.noTransitionSingle', { zone: displayZone || zone })}
          </span>
        </div>
      ) : (
        <div className="dst-transitions-list">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('dst.detectedCount', { count: transitions.length })}
          </p>
          {transitions.map((transition, idx) => (
            <div key={idx} className="dst-transition-item">
              <div className="dst-transition-icon-wrapper">
                {transition.type === 'forward' ? (
                  <ArrowUpRight size={18} style={{ color: 'var(--color-warning)' }} />
                ) : (
                  <ArrowDownRight size={18} style={{ color: 'var(--color-info)' }} />
                )}
              </div>
              <div className="dst-transition-details">
                <div className="dst-transition-meta">
                  {transition.zoneName && <span style={{ color: 'var(--accent-primary)', marginRight: '6px', fontWeight: 600 }}>[{transition.zoneName}]</span>}
                  <span>{transition.date}</span>
                  <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>|</span>
                  <span>{transition.fromOffsetName} → {transition.toOffsetName}</span> 
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    {t('dst.shiftMinutes', { minutes: transition.shiftMinutes > 0 ? `+${transition.shiftMinutes}` : transition.shiftMinutes })}
                  </span>
                </div>
                <div className="dst-transition-desc">{transition.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
