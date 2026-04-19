import type { Todo } from '@home-dashboard/shared';
import * as styles from './TodosPanel.css.js';

interface TodoRowProps {
  todo: Todo;
  pending: boolean;
  onToggle: (todo: Todo) => void;
}

export function TodoRow({ todo, pending, onToggle }: TodoRowProps) {
  const toggleClass = `${styles.toggle}${todo.completed ? ` ${styles.toggleDone}` : ''}`;
  const titleClass = `${styles.titleBase}${todo.completed ? ` ${styles.titleDone}` : ''}`;

  return (
    <li className={styles.todo}>
      <button
        type="button"
        className={toggleClass}
        onClick={() => onToggle(todo)}
        disabled={pending}
        aria-pressed={todo.completed}
        aria-label={
          todo.completed ? `Mark "${todo.title}" as not done` : `Mark "${todo.title}" as done`
        }
      >
        <span aria-hidden="true">{todo.completed ? '✓' : ''}</span>
      </button>
      <div className={styles.body}>
        <div className={titleClass}>{todo.title}</div>
        {(todo.dueDate || todo.priority !== 'medium') && (
          <div className={styles.meta}>
            {todo.priority !== 'medium' && (
              <span className={styles.priority[todo.priority]}>{todo.priority}</span>
            )}
            {todo.dueDate && <span>{todo.dueDate}</span>}
          </div>
        )}
      </div>
    </li>
  );
}
