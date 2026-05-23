import { dateMediumTimeShort, t } from '@home-dashboard/i18n';
import type { CalendarEvent } from '@home-dashboard/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteCalendarEvent, listCalendarEvents } from '../../../api/calendar.js';
import { Button } from '../../common/Button/Button.js';
import { ListRow } from '../primitives/ListRow/ListRow.js';
import { Notice } from '../primitives/Notice/Notice.js';
import { Section } from '../primitives/Section/Section.js';
import { EVENTS_KEY, invalidateEverywhere } from './queries.js';

interface EventsListProps {
  onEdit: (event: CalendarEvent) => void;
}

export function EventsList({ onEdit }: EventsListProps) {
  const qc = useQueryClient();

  const events = useQuery({
    queryKey: EVENTS_KEY,
    queryFn: ({ signal }) => listCalendarEvents({ limit: 200, signal }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      invalidateEverywhere(qc);
    },
  });

  return (
    <Section title={t('admin.events.list.title')}>
      {events.isLoading ? <Notice tone="info">{t('admin.loading')}</Notice> : null}
      {events.data && events.data.length === 0 ? (
        <Notice tone="empty">{t('admin.events.list.empty')}</Notice>
      ) : null}
      {events.data?.map((event) => (
        <ListRow
          key={event.id}
          title={event.title}
          meta={
            <>
              {event.allDay
                ? t('admin.events.list.allDay')
                : `${dateMediumTimeShort.format(new Date(event.startTime))} — ${dateMediumTimeShort.format(
                    new Date(event.endTime),
                  )}`}
              {event.location ? ` · ${event.location}` : ''}
            </>
          }
          actions={
            <>
              <Button variant="subtle" onClick={() => onEdit(event)}>
                {t('admin.form.edit')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(t('admin.events.list.confirmDelete'))) {
                    remove.mutate(event.id);
                  }
                }}
              >
                {t('admin.form.delete')}
              </Button>
            </>
          }
        />
      ))}
    </Section>
  );
}
