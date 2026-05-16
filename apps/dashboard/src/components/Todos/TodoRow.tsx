import type { Todo } from '@home-dashboard/shared';
import { LOCALE, t } from '../../i18n/t.js';
import * as styles from './TodosPanel.css.js';

interface TodoRowProps {
  todo: Todo;
  pending: boolean;
  onToggle: (todo: Todo) => void;
}

const dueDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
});

function formatDueDate(dueDate: string): string {
  return dueDateFormatter.format(new Date(`${dueDate.slice(0, 10)}T00:00:00`));
}

export function TodoRow({ todo, pending, onToggle }: TodoRowProps) {
  const rowClass = `${styles.todo}${todo.completed ? ` ${styles.todoDone}` : ''}`;
  const titleClass = `${styles.titleBase}${todo.completed ? ` ${styles.titleDone}` : ''}`;
  const labelKey = todo.completed ? 'panel.todos.markUndoneLabel' : 'panel.todos.markDoneLabel';
  const buttonKey = todo.completed ? 'panel.todos.undo' : 'panel.todos.done';
  const buttonClass = `${styles.toggle}${todo.completed ? ` ${styles.toggleUndo}` : ''}`;
  const showPriority = todo.priority !== 'medium';
  const showMeta = Boolean(todo.dueDate) || showPriority;

  return (
    <li className={rowClass}>
      <div className={styles.body}>
        <div className={titleClass}>{todo.title}</div>
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
      <button
        type="button"
        className={buttonClass}
        onClick={() => onToggle(todo)}
        disabled={pending}
        aria-pressed={todo.completed}
        aria-label={t(labelKey, { title: todo.title })}
      >
        {t(buttonKey)}
      </button>
    </li>
  );
}
