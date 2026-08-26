import { DateTime } from 'luxon';
import { translate, type Locale } from '../i18n';

export interface CountryTimezone {
  value: string;
  label: string;
  country: string;
  city: string;
  group: string;
  searchText: string;
}

type TimezoneGroupKey = 'commonAsia' | 'america' | 'europeAfrica' | 'oceania' | 'utc';

interface TimezoneEntry {
  value: string;
  groupKey: TimezoneGroupKey;
}

const timezoneDatabase: TimezoneEntry[] = [
  { value: 'Asia/Shanghai', groupKey: 'commonAsia' },
  { value: 'Asia/Hong_Kong', groupKey: 'commonAsia' },
  { value: 'Asia/Taipei', groupKey: 'commonAsia' },
  { value: 'Asia/Macau', groupKey: 'commonAsia' },
  { value: 'Asia/Urumqi', groupKey: 'commonAsia' },
  { value: 'Asia/Tokyo', groupKey: 'commonAsia' },
  { value: 'Asia/Seoul', groupKey: 'commonAsia' },
  { value: 'Asia/Singapore', groupKey: 'commonAsia' },
  { value: 'Asia/Kolkata', groupKey: 'commonAsia' },
  { value: 'Asia/Dubai', groupKey: 'commonAsia' },
  { value: 'America/New_York', groupKey: 'america' },
  { value: 'America/Chicago', groupKey: 'america' },
  { value: 'America/Denver', groupKey: 'america' },
  { value: 'America/Los_Angeles', groupKey: 'america' },
  { value: 'America/Anchorage', groupKey: 'america' },
  { value: 'Pacific/Honolulu', groupKey: 'america' },
  { value: 'America/Toronto', groupKey: 'america' },
  { value: 'America/Vancouver', groupKey: 'america' },
  { value: 'America/Sao_Paulo', groupKey: 'america' },
  { value: 'Europe/London', groupKey: 'europeAfrica' },
  { value: 'Europe/Paris', groupKey: 'europeAfrica' },
  { value: 'Europe/Berlin', groupKey: 'europeAfrica' },
  { value: 'Europe/Rome', groupKey: 'europeAfrica' },
  { value: 'Europe/Moscow', groupKey: 'europeAfrica' },
  { value: 'Africa/Johannesburg', groupKey: 'europeAfrica' },
  { value: 'Africa/Cairo', groupKey: 'europeAfrica' },
  { value: 'Australia/Sydney', groupKey: 'oceania' },
  { value: 'Australia/Adelaide', groupKey: 'oceania' },
  { value: 'Australia/Perth', groupKey: 'oceania' },
  { value: 'Pacific/Auckland', groupKey: 'oceania' },
  { value: 'UTC', groupKey: 'utc' },
];

const SEARCH_LOCALES: Locale[] = ['zh', 'zh-Hant', 'en'];

function cityCountry(entry: TimezoneEntry, locale: Locale): string {
  return translate(locale, `timezone.cities.${entry.value}.country`);
}

function cityLabel(entry: TimezoneEntry, locale: Locale): string {
  return translate(locale, `timezone.cities.${entry.value}.city`);
}

export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
}

function zoneSearchText(entry: TimezoneEntry): string {
  const parts = [entry.value];
  for (const locale of SEARCH_LOCALES) {
    parts.push(cityCountry(entry, locale), cityLabel(entry, locale));
  }
  return parts.join(' ').toLowerCase();
}

function getZonePieces(zoneValue: string, locale: Locale) {
  const entry = timezoneDatabase.find((z) => z.value === zoneValue);
  if (!entry) {
    return null;
  }
  return { entry, country: cityCountry(entry, locale), city: cityLabel(entry, locale) };
}

function annotateZone(country: string, city: string, offsetName: string, offsetDetail: string): string {
  return `${country} - ${city} (${offsetName ? `${offsetName}, ` : ''}${offsetDetail})`;
}

export function getAvailableTimezones(locale: Locale = 'zh'): CountryTimezone[] {
  return timezoneDatabase.map((z) => {
    try {
      const dt = DateTime.now().setZone(z.value);
      const offset = formatUtcOffset(dt.offset);
      const offsetName = dt.offsetNameShort || '';
      return {
        value: z.value,
        label: annotateZone(cityCountry(z, locale), cityLabel(z, locale), offsetName, offset),
        country: cityCountry(z, locale),
        city: cityLabel(z, locale),
        group: translate(locale, `timezone.groups.${z.groupKey}`),
        searchText: zoneSearchText(z),
      };
    } catch {
      return {
        value: z.value,
        label: `${cityCountry(z, locale)} - ${cityLabel(z, locale)} (${z.value})`,
        country: cityCountry(z, locale),
        city: cityLabel(z, locale),
        group: translate(locale, `timezone.groups.${z.groupKey}`),
        searchText: zoneSearchText(z),
      };
    }
  });
}

export function getFriendlyZoneLabel(zoneValue: string, locale: Locale = 'zh'): string {
  const zone = getZonePieces(zoneValue, locale);
  if (!zone) return zoneValue;
  try {
    const dt = DateTime.now().setZone(zoneValue);
    const offset = formatUtcOffset(dt.offset);
    const offsetName = dt.offsetNameShort || '';
    return annotateZone(zone.country, zone.city, offsetName, offset);
  } catch {
    return `${zone.country} - ${zone.city} (${zoneValue})`;
  }
}

export function getZoneShortLabel(zoneValue: string, locale: Locale = 'zh'): string {
  const zone = getZonePieces(zoneValue, locale);
  if (!zone) return zoneValue;
  return `${zone.country} ${zone.city}`;
}
