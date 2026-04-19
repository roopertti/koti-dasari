import type { CreateReminderInput, Reminder, UpdateReminderInput } from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export function listReminders(
  params: {
    acknowledged?: boolean;
    from?: string;
    to?: string;
    limit?: number;
    signal?: AbortSignal;
  } = {},
): Promise<Reminder[]> {
  const { signal, ...query } = params;
  return apiRequest<Reminder[]>('/reminders', { query, signal });
}

export function createReminder(body: CreateReminderInput): Promise<Reminder> {
  return apiRequest<Reminder>('/reminders', { method: 'POST', body });
}

export function updateReminder(id: string, body: UpdateReminderInput): Promise<Reminder> {
  return apiRequest<Reminder>(`/reminders/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
}

export function acknowledgeReminder(id: string): Promise<Reminder> {
  return apiRequest<Reminder>(`/reminders/${encodeURIComponent(id)}/acknowledge`, {
    method: 'PATCH',
  });
}

export function deleteReminder(id: string): Promise<void> {
  return apiRequest<void>(`/reminders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
