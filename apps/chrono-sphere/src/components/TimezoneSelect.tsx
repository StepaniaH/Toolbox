import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { getAvailableTimezones } from '../utils/dateUtils';
import type { CountryTimezone } from '../utils/dateUtils';
import { useTranslation } from '@toolbox/i18n/react';

interface TimezoneSelectProps {
  value: string;
  onChange: (zone: string) => void;
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const { lang, t } = useTranslation();

  const allZones = useMemo(() => getAvailableTimezones(lang), [lang]);
  
  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedZone = allZones.find((z) => z.value === value);
  const displayValue = isOpen ? searchQuery : selectedZone?.label || value;

  const filteredZones = searchQuery.trim()
    ? allZones.filter((zone) => zone.searchText.includes(searchQuery.toLowerCase()))
    : allZones;

  // Group filtered results
  const groups = filteredZones.reduce((acc, curr) => {
    if (!acc[curr.group]) {
      acc[curr.group] = [];
    }
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, CountryTimezone[]>);

  const handleSelect = (zoneValue: string) => {
    onChange(zoneValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setSearchQuery('');
    setIsOpen(true);
  };

  // Ordered groups for display
  const groupOrder = [
    t('timezone.groups.commonAsia'),
    t('timezone.groups.america'),
    t('timezone.groups.europeAfrica'),
    t('timezone.groups.oceania'),
    t('timezone.groups.utc'),
  ];

  return (
    <div className="timezone-search-container" ref={containerRef}>
      <div className="input-icon-wrapper">
        <Globe className="input-icon" size={18} />
        <input
          type="text"
          className="form-input"
          placeholder={t('timezone.placeholder')}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
              setSearchQuery('');
            }
          }}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-haspopup="listbox"
          style={{ paddingRight: '40px' }}
        />
        <button
          type="button"
          className="timezone-chevron-btn"
          onClick={() => {
            setIsOpen((current) => !current);
            if (!isOpen) {
              setSearchQuery('');
            }
          }}
          aria-label={isOpen ? t('timezone.closeMenu') : t('timezone.openMenu')}
        >
          <ChevronDown size={16} className={`timezone-chevron ${isOpen ? 'open' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="timezone-dropdown" id={listboxId} role="listbox">
          {Object.keys(groups).length === 0 ? (
            <div className="timezone-empty-state">
              {t('timezone.empty')}
            </div>
          ) : (
            groupOrder.map(groupName => {
              const items = groups[groupName];
              if (!items || items.length === 0) return null;

              return (
                <div key={groupName}>
                  <div className="timezone-group-header">{groupName}</div>
                  {items.map(z => (
                    <button
                      type="button"
                      key={z.value}
                      className={`timezone-option ${z.value === value ? 'selected' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(z.value)}
                      role="option"
                      aria-selected={z.value === value}
                    >
                      <span>{z.label}</span>
                      {z.value === value && <Check size={14} className="selected-check" />}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
