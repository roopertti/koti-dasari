import type { CalendarEvent } from '@home-dashboard/shared';
import { useCalendarEvents } from '../../hooks/useCalendarEvents.js';
import { Stack } from '../common/Stack/Stack.js';
import * as styles from './TodayEvents.css.js';

const VISIBLE = 2;

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(event: CalendarEvent, todayKey: string): boolean {
  if (event.allDay) {
    return event.startTime.slice(0, 10) === todayKey;
  }
  return localDateKey(new Date(event.startTime)) === todayKey;
}

export function TodayEvents() {
  const { data } = useCalendarEvents();

  if (!data) {
    return null;
  }

  const todayKey = localDateKey(new Date());
  const todays = data.filter((event) => isToday(event, todayKey));

  if (todays.length === 0) {
    return null;
  }

  const visible = todays.slice(0, VISIBLE);
  const hidden = todays.length - visible.length;

  return (
    <div className={styles.wrap} data-testid="today-events">
      <span className={styles.label}>Today</span>
      <Stack as="ul" gap="tight">
        {visible.map((event) => (
          <li key={event.id} className={styles.event}>
            <span className={styles.eventTime}>
              {event.allDay ? 'All day' : timeFormatter.format(new Date(event.startTime))}
            </span>
            <span className={styles.eventTitle}>{event.title}</span>
          </li>
        ))}
      </Stack>
      {hidden > 0 && (
        <span className={styles.more}>
          +{hidden} other event{hidden === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}
