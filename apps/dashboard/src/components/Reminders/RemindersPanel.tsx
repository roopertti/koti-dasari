import type { Reminder } from '@home-dashboard/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { acknowledgeReminder, listReminders } from '../../api/reminders.js';
import { PanelShell } from '../common/PanelShell.js';
import { ReminderRow } from './ReminderRow.js';
import * as styles from './RemindersPanel.css.js';

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
      // TODO: surface failure in the UI (toast or row-level error state). Panel is
      // currently hidden when empty, so interactive failures aren't yet observable.
      console.error('Failed to acknowledge reminder', err);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(reminder.id);
        return next;
      });
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <PanelShell title="Reminders" testId="panel-reminders">
      <ul className={styles.list}>
        {data.map((reminder) => (
          <ReminderRow
            key={reminder.id}
            reminder={reminder}
            pending={pendingIds.has(reminder.id)}
            onAcknowledge={handleAcknowledge}
          />
        ))}
      </ul>
    </PanelShell>
  );
}
