import { dueDateShort, parseLocalDate, t } from '@home-dashboard/i18n';
import type { Todo } from '@home-dashboard/shared';
import { useId } from 'react';
import { Button } from '../../common/Button/Button.js';
import { VisuallyHidden } from '../../common/VisuallyHidden/VisuallyHidden.js';
import * as styles from './TodoRow.css.js';

interface TodoRowProps {
  todo: Todo;
  pending: boolean;
  onToggle: (todo: Todo) => void;
  onOpen: (todo: Todo) => void;
  /** Full-screen view: also show the todo's description under its metadata. */
  detailed?: boolean;
}

function formatDueDate(dueDate: string): string {
  return dueDateShort.format(parseLocalDate(dueDate));
}

export function TodoRow({ todo, pending, onToggle, onOpen, detailed }: TodoRowProps) {
  const hintId = useId();
  const state = todo.completed ? 'done' : 'active';
  const labelKey = todo.completed ? 'panel.todos.markUndoneLabel' : 'panel.todos.markDoneLabel';
  const buttonKey = todo.completed ? 'panel.todos.undo' : 'panel.todos.done';
  const showPriority = todo.priority !== 'medium';
  const showMeta = Boolean(todo.dueDate) || showPriority;

  return (
    <li className={styles.row[state]}>
      <button
        type="button"
        className={styles.body}
        onClick={() => onOpen(todo)}
        aria-describedby={hintId}
      >
        <span className={styles.title[state]}>{todo.title}</span>
        {showMeta && (
          <span className={styles.meta}>
            {showPriority && (
              <span className={styles.priority[todo.priority]}>
                {t(`panel.todos.priority.${todo.priority}`)}
              </span>
            )}
            {todo.dueDate && <span>{formatDueDate(todo.dueDate)}</span>}
          </span>
        )}
        {detailed && todo.description ? (
          <span className={styles.description}>{todo.description}</span>
        ) : null}
      </button>
      <VisuallyHidden id={hintId}>{t('panel.todos.openHint')}</VisuallyHidden>
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
