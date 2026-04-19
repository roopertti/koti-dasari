import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export function listCalendarEvents(
  params: { from?: string; to?: string; limit?: number; signal?: AbortSignal } = {},
): Promise<CalendarEvent[]> {
  const { signal, ...query } = params;
  return apiRequest<CalendarEvent[]>('/calendar/events', { query, signal });
}

export function getCalendarEvent(id: string, signal?: AbortSignal): Promise<CalendarEvent> {
  return apiRequest<CalendarEvent>(`/calendar/events/${encodeURIComponent(id)}`, { signal });
}

export function createCalendarEvent(body: CreateCalendarEventInput): Promise<CalendarEvent> {
  return apiRequest<CalendarEvent>('/calendar/events', {
    method: 'POST',
    body,
  });
}

export function updateCalendarEvent(
  id: string,
  body: UpdateCalendarEventInput,
): Promise<CalendarEvent> {
  return apiRequest<CalendarEvent>(`/calendar/events/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCalendarEvent(id: string): Promise<void> {
  return apiRequest<void>(`/calendar/events/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
