import type { Reminder } from '@home-dashboard/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { acknowledgeReminder, listReminders } from '../../api/reminders.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { PanelShell } from '../common/PanelShell/PanelShell.js';
import { Stack } from '../common/Stack/Stack.js';
import { ReminderRow } from './ReminderRow.js';

const REFRESH_MS = 30_000;
const REMINDERS_KEY = ['reminders', { acknowledged: false, limit: 50 }] as const;

export function RemindersPanel() {
  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: REMINDERS_KEY,
    queryFn: ({ signal }) => listReminders({ acknowledged: false, limit: 50, signal }),
    refetchInterval: REFRESH_MS,
  });

  const handleAcknowledge = async (reminder: Reminder) => {
    setPendingIds((prev) => new Set(prev).add(reminder.id));
    try {
      await acknowledgeReminder(reminder.id);
      await queryClient.invalidateQueries({ queryKey: ['reminders'] });
    } catch (err) {
      // TODO: surface failure in the UI (toast or row-level error state).
      console.error('Failed to acknowledge reminder', err);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(reminder.id);
        return next;
      });
    }
  };

  return (
    <PanelShell title="Reminders" testId="panel-reminders">
      {!data || data.length === 0 ? (
        <PanelMessage variant="empty">No reminders</PanelMessage>
      ) : (
        <Stack as="ul" gap="sm">
          {data.map((reminder) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              pending={pendingIds.has(reminder.id)}
              onAcknowledge={handleAcknowledge}
            />
          ))}
        </Stack>
      )}
    </PanelShell>
  );
}
