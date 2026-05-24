export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string | null;
  source: CalendarEventSource;
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventSource = 'manual' | `ical:${string}`;

export const FINNISH_HOLIDAYS_SOURCE = 'ical:finnish-holidays' as const;

export function isManualEvent(event: Pick<CalendarEvent, 'source'>): boolean {
  return event.source === 'manual';
}

export function isFinnishHolidaysEvent(event: Pick<CalendarEvent, 'source'>): boolean {
  return event.source === FINNISH_HOLIDAYS_SOURCE;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  color?: string | null;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string | null;
  location?: string | null;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  color?: string | null;
}
