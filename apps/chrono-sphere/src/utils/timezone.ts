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
  countryZh: string;
  countryEn: string;
  cityZh: string;
  cityEn: string;
  groupKey: TimezoneGroupKey;
}

const timezoneDatabase: TimezoneEntry[] = [
  { value: 'Asia/Shanghai', countryZh: '中国', countryEn: 'China', cityZh: '北京 / 上海（北京时间）', cityEn: 'Beijing / Shanghai (China Standard Time)', groupKey: 'commonAsia' },
  { value: 'Asia/Hong_Kong', countryZh: '中国香港', countryEn: 'Hong Kong', cityZh: '香港', cityEn: 'Hong Kong', groupKey: 'commonAsia' },
  { value: 'Asia/Taipei', countryZh: '中国台湾', countryEn: 'Taiwan', cityZh: '台北', cityEn: 'Taipei', groupKey: 'commonAsia' },
  { value: 'Asia/Macau', countryZh: '中国澳门', countryEn: 'Macau', cityZh: '澳门', cityEn: 'Macau', groupKey: 'commonAsia' },
  { value: 'Asia/Urumqi', countryZh: '中国', countryEn: 'China', cityZh: '乌鲁木齐（新疆时间）', cityEn: 'Urumqi (Xinjiang Time)', groupKey: 'commonAsia' },
  { value: 'Asia/Tokyo', countryZh: '日本', countryEn: 'Japan', cityZh: '东京', cityEn: 'Tokyo', groupKey: 'commonAsia' },
  { value: 'Asia/Seoul', countryZh: '韩国', countryEn: 'South Korea', cityZh: '首尔', cityEn: 'Seoul', groupKey: 'commonAsia' },
  { value: 'Asia/Singapore', countryZh: '新加坡', countryEn: 'Singapore', cityZh: '新加坡', cityEn: 'Singapore', groupKey: 'commonAsia' },
  { value: 'Asia/Kolkata', countryZh: '印度', countryEn: 'India', cityZh: '加尔各答', cityEn: 'Kolkata', groupKey: 'commonAsia' },
  { value: 'Asia/Dubai', countryZh: '阿联酋', countryEn: 'United Arab Emirates', cityZh: '迪拜', cityEn: 'Dubai', groupKey: 'commonAsia' },
  { value: 'America/New_York', countryZh: '美国', countryEn: 'United States', cityZh: '纽约（东部时间）', cityEn: 'New York (Eastern Time)', groupKey: 'america' },
  { value: 'America/Chicago', countryZh: '美国', countryEn: 'United States', cityZh: '芝加哥（中部时间）', cityEn: 'Chicago (Central Time)', groupKey: 'america' },
  { value: 'America/Denver', countryZh: '美国', countryEn: 'United States', cityZh: '丹佛（山地时间）', cityEn: 'Denver (Mountain Time)', groupKey: 'america' },
  { value: 'America/Los_Angeles', countryZh: '美国', countryEn: 'United States', cityZh: '洛杉矶（太平洋时间）', cityEn: 'Los Angeles (Pacific Time)', groupKey: 'america' },
  { value: 'America/Anchorage', countryZh: '美国', countryEn: 'United States', cityZh: '安克雷奇（阿拉斯加时间）', cityEn: 'Anchorage (Alaska Time)', groupKey: 'america' },
  { value: 'Pacific/Honolulu', countryZh: '美国', countryEn: 'United States', cityZh: '檀香山 / 火奴鲁鲁（夏威夷时间）', cityEn: 'Honolulu (Hawaii Time)', groupKey: 'america' },
  { value: 'America/Toronto', countryZh: '加拿大', countryEn: 'Canada', cityZh: '多伦多（东部时间）', cityEn: 'Toronto (Eastern Time)', groupKey: 'america' },
  { value: 'America/Vancouver', countryZh: '加拿大', countryEn: 'Canada', cityZh: '温哥华（太平洋时间）', cityEn: 'Vancouver (Pacific Time)', groupKey: 'america' },
  { value: 'America/Sao_Paulo', countryZh: '巴西', countryEn: 'Brazil', cityZh: '圣保罗', cityEn: 'Sao Paulo', groupKey: 'america' },
  { value: 'Europe/London', countryZh: '英国', countryEn: 'United Kingdom', cityZh: '伦敦（格林威治 / 夏令时）', cityEn: 'London (GMT / BST)', groupKey: 'europeAfrica' },
  { value: 'Europe/Paris', countryZh: '法国', countryEn: 'France', cityZh: '巴黎（中欧时间）', cityEn: 'Paris (Central European Time)', groupKey: 'europeAfrica' },
  { value: 'Europe/Berlin', countryZh: '德国', countryEn: 'Germany', cityZh: '柏林（中欧时间）', cityEn: 'Berlin (Central European Time)', groupKey: 'europeAfrica' },
  { value: 'Europe/Rome', countryZh: '意大利', countryEn: 'Italy', cityZh: '罗马（中欧时间）', cityEn: 'Rome (Central European Time)', groupKey: 'europeAfrica' },
  { value: 'Europe/Moscow', countryZh: '俄罗斯', countryEn: 'Russia', cityZh: '莫斯科', cityEn: 'Moscow', groupKey: 'europeAfrica' },
  { value: 'Africa/Johannesburg', countryZh: '南非', countryEn: 'South Africa', cityZh: '约翰内斯堡', cityEn: 'Johannesburg', groupKey: 'europeAfrica' },
  { value: 'Africa/Cairo', countryZh: '埃及', countryEn: 'Egypt', cityZh: '开罗', cityEn: 'Cairo', groupKey: 'europeAfrica' },
  { value: 'Australia/Sydney', countryZh: '澳大利亚', countryEn: 'Australia', cityZh: '悉尼（东部时间）', cityEn: 'Sydney (Eastern Time)', groupKey: 'oceania' },
  { value: 'Australia/Adelaide', countryZh: '澳大利亚', countryEn: 'Australia', cityZh: '阿德莱德（中部时间）', cityEn: 'Adelaide (Central Time)', groupKey: 'oceania' },
  { value: 'Australia/Perth', countryZh: '澳大利亚', countryEn: 'Australia', cityZh: '珀斯（西部时间）', cityEn: 'Perth (Western Time)', groupKey: 'oceania' },
  { value: 'Pacific/Auckland', countryZh: '新西兰', countryEn: 'New Zealand', cityZh: '奥克兰', cityEn: 'Auckland', groupKey: 'oceania' },
  { value: 'UTC', countryZh: '协调世界时', countryEn: 'Coordinated Universal Time', cityZh: '全球（UTC）', cityEn: 'Global (UTC)', groupKey: 'utc' },
];

export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
}

function getZonePieces(zoneValue: string, locale: Locale) {
  const entry = timezoneDatabase.find((z) => z.value === zoneValue);
  if (!entry) {
    return null;
  }

  const country = locale === 'en' ? entry.countryEn : entry.countryZh;
  const city = locale === 'en' ? entry.cityEn : entry.cityZh;
  return { entry, country, city };
}

export function getAvailableTimezones(locale: Locale = 'zh'): CountryTimezone[] {
  return timezoneDatabase.map((z) => {
    try {
      const dt = DateTime.now().setZone(z.value);
      const offset = formatUtcOffset(dt.offset);
      const offsetName = dt.offsetNameShort || '';
      const country = locale === 'en' ? z.countryEn : z.countryZh;
      const city = locale === 'en' ? z.cityEn : z.cityZh;
      const group = translate(locale, `timezone.groups.${z.groupKey}`);
      const label = `${country} - ${city} (${offsetName ? `${offsetName}, ` : ''}${offset})`;
      return {
        value: z.value,
        label,
        country,
        city,
        group,
        searchText: `${z.countryZh} ${z.countryEn} ${z.cityZh} ${z.cityEn} ${z.value}`.toLowerCase(),
      };
    } catch {
      const country = locale === 'en' ? z.countryEn : z.countryZh;
      const city = locale === 'en' ? z.cityEn : z.cityZh;
      return {
        value: z.value,
        label: `${country} - ${city} (${z.value})`,
        country,
        city,
        group: translate(locale, `timezone.groups.${z.groupKey}`),
        searchText: `${z.countryZh} ${z.countryEn} ${z.cityZh} ${z.cityEn} ${z.value}`.toLowerCase(),
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
    return `${zone.country} - ${zone.city} (${offsetName ? `${offsetName}, ` : ''}${offset})`;
  } catch {
    return `${zone.country} - ${zone.city} (${zoneValue})`;
  }
}

export function getZoneShortLabel(zoneValue: string, locale: Locale = 'zh'): string {
  const zone = getZonePieces(zoneValue, locale);
  if (!zone) return zoneValue;
  return `${zone.country} ${zone.city}`;
}
