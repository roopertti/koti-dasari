import {
  diffDays,
  type Horizon,
  horizonFromOffset,
  parseEventStart,
  parseLocalDate,
  t,
  timeHm,
  weekdayShort,
} from '@home-dashboard/i18n';
import type { CalendarEvent, Todo } from '@home-dashboard/shared';
import { CalendarDays, ListTodo, type LucideIcon } from 'lucide-react';
import { useCalendarEvents } from '../../hooks/useCalendarEvents.js';
import { useTodos } from '../../hooks/useTodos.js';
import * as styles from './TodaySoonRail.css.js';

const VISIBLE = 4;

type Kind = 'event' | 'todo';

interface RailItem {
  key: string;
  kind: Kind;
  horizon: Horizon;
  title: string;
  when: string;
  sortAt: number;
}

const KIND_ICONS: Record<Kind, LucideIcon> = {
  event: CalendarDays,
  todo: ListTodo,
};

const KIND_LABEL_KEYS: Record<Kind, string> = {
  event: 'rail.item.event',
  todo: 'rail.item.todo',
};

const HORIZON_ORDER: Horizon[] = ['overdue', 'today', 'tomorrow', 'thisWeek'];

function buildEventItems(events: CalendarEvent[], now: Date): RailItem[] {
  return events.flatMap((event) => {
    const start = parseEventStart(event);
    const offset = diffDays(start, now);
    // Only surface events from today onwards; past events are pruned.
    if (offset < 0) {
      return [];
    }
    const horizon = horizonFromOffset(offset);
    if (!horizon) {
      return [];
    }
    const when = event.allDay
      ? t('panel.calendar.allDay')
      : `${weekdayShort.format(start)} · ${timeHm.format(start)}`;
    return [
      {
        key: `event-${event.id}`,
        kind: 'event' as const,
        horizon,
        title: event.title,
        when,
        sortAt: start.getTime(),
      },
    ];
  });
}

function buildTodoItems(todos: Todo[], now: Date): RailItem[] {
  return todos.flatMap((todo) => {
    if (todo.completed || !todo.dueDate) {
      return [];
    }
    const due = parseLocalDate(todo.dueDate);
    const offset = diffDays(due, now);
    const horizon = horizonFromOffset(offset);
    if (!horizon) {
      return [];
    }
    const when = horizon === 'overdue' || horizon === 'thisWeek' ? weekdayShort.format(due) : '';
    return [
      {
        key: `todo-${todo.id}`,
        kind: 'todo' as const,
        horizon,
        title: todo.title,
        when,
        sortAt: due.getTime(),
      },
    ];
  });
}

function sortItems(items: RailItem[]): RailItem[] {
  const horizonRank = (h: Horizon) => HORIZON_ORDER.indexOf(h);
  return [...items].sort((a, b) => {
    const rank = horizonRank(a.horizon) - horizonRank(b.horizon);
    if (rank !== 0) {
      return rank;
    }
    return a.sortAt - b.sortAt;
  });
}

export function TodaySoonRail() {
  const events = useCalendarEvents();
  const todos = useTodos();

  if (!events.data || !todos.data) {
    return null;
  }

  const now = new Date();
  const items = sortItems([
    ...buildEventItems(events.data, now),
    ...buildTodoItems(todos.data, now),
  ]);

  if (items.length === 0) {
    return null;
  }

  const visible = items.slice(0, VISIBLE);
  const hidden = items.length - visible.length;

  return (
    <div className={styles.wrap} data-testid="today-soon-rail">
      <span className={styles.label}>{t('rail.label')}</span>
      <ul className={styles.list}>
        {visible.map((item) => {
          const Icon = KIND_ICONS[item.kind];
          return (
            <li
              key={item.key}
              className={styles.item}
              data-overdue={item.horizon === 'overdue' ? 'true' : undefined}
            >
              <span
                className={styles.kindIcon}
                role="img"
                aria-label={t(KIND_LABEL_KEYS[item.kind])}
              >
                <Icon size="1em" strokeWidth={1.75} />
              </span>
              <span className={styles.horizon}>{t(`rail.heading.${item.horizon}`)}</span>
              {item.when && <span className={styles.when}>{item.when}</span>}
              <span className={styles.title}>{item.title}</span>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <span className={styles.more}>
          {t(hidden === 1 ? 'rail.moreOne' : 'rail.moreMany', { count: hidden })}
        </span>
      )}
    </div>
  );
}
