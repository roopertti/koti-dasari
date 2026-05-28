import { t } from '@home-dashboard/i18n';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(publishedAtIso: string, now: Date = new Date()): string {
  const published = new Date(publishedAtIso).getTime();
  const diff = now.getTime() - published;

  if (diff < MINUTE_MS) {
    return t('panel.news.relativeNow');
  }
  if (diff < HOUR_MS) {
    return t('panel.news.relativeMin', { minutes: Math.floor(diff / MINUTE_MS) });
  }
  if (diff < DAY_MS) {
    return t('panel.news.relativeHour', { hours: Math.floor(diff / HOUR_MS) });
  }
  return t('panel.news.relativeDay', { days: Math.floor(diff / DAY_MS) });
}
