import { t } from '@home-dashboard/i18n';
import type { CalendarEvent } from '@home-dashboard/shared';
import { useState } from 'react';
import { useCalendarEvents } from '../../hooks/useCalendarEvents.js';
import { FocusablePanel } from '../common/FocusablePanel/FocusablePanel.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { Stack } from '../common/Stack/Stack.js';
import { CalendarDayGroup } from './CalendarDayGroup/CalendarDayGroup.js';
import { EventDetailDialog } from './EventDetailDialog/EventDetailDialog.js';

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

interface CalendarListProps {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
  detailed?: boolean;
}

function CalendarList({ events, onSelect, detailed }: CalendarListProps) {
  return (
    <Stack as="ul" gap="loose">
      {Array.from(groupByDay(events).entries()).map(([day, dayEvents]) => (
        <CalendarDayGroup
          key={day}
          day={day}
          events={dayEvents}
          onSelect={onSelect}
          detailed={detailed}
        />
      ))}
    </Stack>
  );
}

export function CalendarPanel() {
  const { data } = useCalendarEvents();
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const hasEvents = !!data && data.length > 0;

  return (
    <>
      <FocusablePanel
        title={t('panel.calendar.title')}
        testId="panel-calendar"
        expandable={hasEvents}
        compact={
          hasEvents ? (
            <CalendarList events={data} onSelect={setSelected} />
          ) : (
            <PanelMessage variant="empty">{t('panel.calendar.empty')}</PanelMessage>
          )
        }
        expanded={hasEvents ? <CalendarList events={data} onSelect={setSelected} detailed /> : null}
      />
      <EventDetailDialog event={selected} onClose={() => setSelected(null)} />
    </>
  );
}
