import { dateLong, t, timeHm } from '@home-dashboard/i18n';
import { type CalendarEvent, isFinnishHolidaysEvent } from '@home-dashboard/shared';
import { DetailDialog } from '../../common/DetailDialog/DetailDialog.js';
import { DetailRow } from '../../common/DetailList/DetailList.js';

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

function formatWhen(event: CalendarEvent): string {
  const day = dateLong.format(new Date(event.startTime));
  if (event.allDay) {
    return `${day} · ${t('panel.calendar.allDay')}`;
  }
  const from = timeHm.format(new Date(event.startTime));
  const to = timeHm.format(new Date(event.endTime));
  return `${day} · ${from} – ${to}`;
}

function sourceLabel(event: CalendarEvent): string {
  return isFinnishHolidaysEvent(event)
    ? t('panel.calendar.detail.sourceHolidays')
    : t('panel.calendar.detail.sourceManual');
}

export function EventDetailDialog({ event, onClose }: EventDetailDialogProps) {
  return (
    <DetailDialog
      open={!!event}
      title={event?.title ?? ''}
      onClose={onClose}
      testId="event-detail-dialog"
      description={event?.description ?? null}
      details={
        event && (
          <>
            <DetailRow label={t('panel.calendar.detail.when')}>{formatWhen(event)}</DetailRow>
            {event.location && (
              <DetailRow label={t('panel.calendar.detail.location')}>{event.location}</DetailRow>
            )}
            <DetailRow label={t('panel.calendar.detail.source')}>{sourceLabel(event)}</DetailRow>
          </>
        )
      }
    />
  );
}
