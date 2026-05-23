import { dueDateShort, parseLocalDate, t } from '@home-dashboard/i18n';
import type { Todo } from '@home-dashboard/shared';
import { Button } from '../../common/Button/Button.js';
import * as styles from './TodoRow.css.js';

interface TodoRowProps {
  todo: Todo;
  pending: boolean;
  onToggle: (todo: Todo) => void;
}

function formatDueDate(dueDate: string): string {
  return dueDateShort.format(parseLocalDate(dueDate));
}

export function TodoRow({ todo, pending, onToggle }: TodoRowProps) {
  const state = todo.completed ? 'done' : 'active';
  const labelKey = todo.completed ? 'panel.todos.markUndoneLabel' : 'panel.todos.markDoneLabel';
  const buttonKey = todo.completed ? 'panel.todos.undo' : 'panel.todos.done';
  const showPriority = todo.priority !== 'medium';
  const showMeta = Boolean(todo.dueDate) || showPriority;

  return (
    <li className={styles.row[state]}>
      <div className={styles.body}>
        <div className={styles.title[state]}>{todo.title}</div>
        {showMeta && (
          <div className={styles.meta}>
            {showPriority && (
              <span className={styles.priority[todo.priority]}>
                {t(`panel.todos.priority.${todo.priority}`)}
              </span>
            )}
            {todo.dueDate && <span>{formatDueDate(todo.dueDate)}</span>}
          </div>
        )}
      </div>
      <Button
        variant={todo.completed ? 'subtle' : 'primary'}
        onClick={() => onToggle(todo)}
        disabled={pending}
        aria-pressed={todo.completed}
        aria-label={t(labelKey, { title: todo.title })}
      >
        {t(buttonKey)}
      </Button>
    </li>
  );
}
