import type { Reminder } from '@home-dashboard/shared';
import * as styles from './RemindersPanel.css.js';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function formatRemindAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return sameDay
    ? timeFormatter.format(date)
    : `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

interface ReminderRowProps {
  reminder: Reminder;
  pending: boolean;
  onAcknowledge: (reminder: Reminder) => void;
}

export function ReminderRow({ reminder, pending, onAcknowledge }: ReminderRowProps) {
  const due = new Date(reminder.remindAt).getTime() <= Date.now();
  const className = `${styles.reminder}${due ? ` ${styles.reminderDue}` : ''}`;

  return (
    <li className={className}>
      <div className={styles.body}>
        <div className={styles.title}>{reminder.title}</div>
        <div className={styles.when}>
          {formatRemindAt(reminder.remindAt)}
          {reminder.recurring ? ' · recurring' : ''}
        </div>
      </div>
      <button
        type="button"
        className={styles.ack}
        onClick={() => onAcknowledge(reminder)}
        disabled={pending}
        aria-label={`Acknowledge "${reminder.title}"`}
      >
        Done
      </button>
    </li>
  );
}
