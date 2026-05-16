import type { CalendarEvent } from '@home-dashboard/shared';
import { LOCALE, t } from '../../i18n/t.js';
import { vars } from '../../styles/theme.css.js';
import * as styles from './CalendarPanel.css.js';

const dayHeaderFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

interface CalendarDayGroupProps {
  day: string;
  events: CalendarEvent[];
}

export function CalendarDayGroup({ day, events }: CalendarDayGroupProps) {
  return (
    <li>
      <div className={styles.dayLabel}>
        {dayHeaderFormatter.format(new Date(`${day}T00:00:00`))}
      </div>
      <ul className={styles.dayEvents}>
        {events.map((event) => (
          <li key={event.id} className={styles.event}>
            <div
              className={styles.eventBar}
              style={{ background: event.color ?? vars.color.accent }}
              aria-hidden="true"
            />
            <div>
              <div className={styles.eventTitle}>{event.title}</div>
              <div className={styles.eventWhen}>
                {event.allDay
                  ? t('panel.calendar.allDay')
                  : `${timeFormatter.format(new Date(event.startTime))} – ${timeFormatter.format(new Date(event.endTime))}`}
                {event.location ? <span> · {event.location}</span> : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </li>
  );
}
