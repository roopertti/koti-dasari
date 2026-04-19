import { useQuery } from '@tanstack/react-query';
import { listCalendarEvents } from '../../api/calendar.js';
import { PanelShell } from '../common/PanelShell.js';
import { CalendarDayGroup } from './CalendarDayGroup.js';
import * as styles from './CalendarPanel.css.js';

const REFRESH_MS = 60_000;
const LOOKAHEAD_DAYS = 14;

function groupByDay<T extends { startTime: string }>(events: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const event of events) {
    const key = event.startTime.slice(0, 10);
    const list = groups.get(key);

    if (list) {
      list.push(event);
    } else {
      groups.set(key, [event]);
    }
  }

  return groups;
}

export function CalendarPanel() {
  const { data } = useQuery({
    queryKey: ['calendar', 'events', { lookaheadDays: LOOKAHEAD_DAYS }],
    queryFn: ({ signal }) => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + LOOKAHEAD_DAYS);
      return listCalendarEvents({
        from: from.toISOString(),
        to: to.toISOString(),
        limit: 50,
        signal,
      });
    },
    refetchInterval: REFRESH_MS,
  });

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <PanelShell title="Calendar" testId="panel-calendar">
      <ul className={styles.list}>
        {Array.from(groupByDay(data).entries()).map(([day, events]) => (
          <CalendarDayGroup key={day} day={day} events={events} />
        ))}
      </ul>
    </PanelShell>
  );
}
