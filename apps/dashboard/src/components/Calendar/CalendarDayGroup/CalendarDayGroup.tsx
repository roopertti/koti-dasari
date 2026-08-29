import { dayHeader, parseLocalDate, t, timeHm } from '@home-dashboard/i18n';
import { type CalendarEvent, isFinnishHolidaysEvent } from '@home-dashboard/shared';
import { type CSSProperties, useId } from 'react';
import { VisuallyHidden } from '../../common/VisuallyHidden/VisuallyHidden.js';
import * as styles from './CalendarDayGroup.css.js';

interface CalendarDayGroupProps {
  day: string;
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
  /** Full-screen view: also show each event's description under its time. */
  detailed?: boolean;
}

function barStyle(color: string | null): CSSProperties | undefined {
  return color ? ({ '--event-color': color } as CSSProperties) : undefined;
}

export function CalendarDayGroup({ day, events, onSelect, detailed }: CalendarDayGroupProps) {
  const hintId = useId();

  return (
    <li>
      <div className={styles.dayLabel}>{dayHeader.format(parseLocalDate(day))}</div>
      <ul className={styles.dayEvents}>
        {events.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              className={styles.event}
              onClick={() => onSelect(event)}
              aria-describedby={hintId}
            >
              <span className={styles.eventBar} style={barStyle(event.color)} aria-hidden="true" />
              <span className={styles.eventText}>
                <span className={styles.eventTitle}>
                  {isFinnishHolidaysEvent(event) ? (
                    <span
                      className={styles.sourceFlag}
                      role="img"
                      aria-label={t('panel.calendar.sourceFlag.holidays')}
                      title={t('panel.calendar.sourceFlag.holidays')}
                    >
                      🇫🇮
                    </span>
                  ) : null}
                  {event.title}
                </span>
                <span className={styles.eventWhen}>
                  {event.allDay
                    ? t('panel.calendar.allDay')
                    : `${timeHm.format(new Date(event.startTime))} – ${timeHm.format(new Date(event.endTime))}`}
                  {event.location ? <span> · {event.location}</span> : null}
                </span>
                {detailed && event.description ? (
                  <span className={styles.eventDescription}>{event.description}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <VisuallyHidden id={hintId}>{t('panel.calendar.openHint')}</VisuallyHidden>
    </li>
  );
}
