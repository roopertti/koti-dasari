import { dayHeader, parseLocalDate, t, timeHm } from '@home-dashboard/i18n';
import type { CalendarEvent } from '@home-dashboard/shared';
import type { CSSProperties } from 'react';
import * as styles from './CalendarDayGroup.css.js';

interface CalendarDayGroupProps {
  day: string;
  events: CalendarEvent[];
}

function barStyle(color: string | null): CSSProperties | undefined {
  return color ? ({ '--event-color': color } as CSSProperties) : undefined;
}

export function CalendarDayGroup({ day, events }: CalendarDayGroupProps) {
  return (
    <li>
      <div className={styles.dayLabel}>{dayHeader.format(parseLocalDate(day))}</div>
      <ul className={styles.dayEvents}>
        {events.map((event) => (
          <li key={event.id} className={styles.event}>
            <div className={styles.eventBar} style={barStyle(event.color)} aria-hidden="true" />
            <div>
              <div className={styles.eventTitle}>{event.title}</div>
              <div className={styles.eventWhen}>
                {event.allDay
                  ? t('panel.calendar.allDay')
                  : `${timeHm.format(new Date(event.startTime))} – ${timeHm.format(new Date(event.endTime))}`}
                {event.location ? <span> · {event.location}</span> : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </li>
  );
}
