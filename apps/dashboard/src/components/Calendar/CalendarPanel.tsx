import { useCalendarEvents } from '../../hooks/useCalendarEvents.js';
import { PanelMessage } from '../common/PanelMessage.js';
import { PanelShell } from '../common/PanelShell.js';
import { Stack } from '../common/Stack.js';
import { CalendarDayGroup } from './CalendarDayGroup.js';

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
  const { data } = useCalendarEvents();

  return (
    <PanelShell title="Calendar" testId="panel-calendar">
      {!data || data.length === 0 ? (
        <PanelMessage variant="empty">No upcoming events</PanelMessage>
      ) : (
        <Stack as="ul" gap="loose">
          {Array.from(groupByDay(data).entries()).map(([day, events]) => (
            <CalendarDayGroup key={day} day={day} events={events} />
          ))}
        </Stack>
      )}
    </PanelShell>
  );
}
