import { t } from '@home-dashboard/i18n';
import type { Todo } from '@home-dashboard/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteTodo, listTodos } from '../../../api/todos.js';
import { Button } from '../../common/Button/Button.js';
import { ListRow } from '../primitives/ListRow/ListRow.js';
import { Notice } from '../primitives/Notice/Notice.js';
import { Section } from '../primitives/Section/Section.js';
import { invalidateEverywhere, TODOS_KEY } from './queries.js';

interface TodosListProps {
  onEdit: (todo: Todo) => void;
}

export function TodosList({ onEdit }: TodosListProps) {
  const qc = useQueryClient();

  const todos = useQuery({
    queryKey: TODOS_KEY,
    queryFn: ({ signal }) => listTodos({ limit: 200, signal }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: () => {
      invalidateEverywhere(qc);
    },
  });

  return (
    <Section title={t('admin.todos.list.title')}>
      {todos.isLoading ? <Notice tone="info">{t('admin.loading')}</Notice> : null}
      {todos.data && todos.data.length === 0 ? (
        <Notice tone="empty">{t('admin.todos.list.empty')}</Notice>
      ) : null}
      {todos.data?.map((todo) => (
        <ListRow
          key={todo.id}
          title={
            <>
              {todo.title}
              {todo.completed ? ` · ${t('admin.todos.list.done')}` : ''}
            </>
          }
          meta={
            <>
              {t(`admin.todos.priority.${todo.priority}`)}
              {todo.dueDate ? ` · ${t('admin.todos.list.due', { date: todo.dueDate })}` : ''}
            </>
          }
          actions={
            <>
              <Button variant="subtle" onClick={() => onEdit(todo)}>
                {t('admin.form.edit')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(t('admin.todos.list.confirmDelete'))) {
                    remove.mutate(todo.id);
                  }
                }}
              >
                {t('admin.form.delete')}
              </Button>
            </>
          }
        />
      ))}
    </Section>
  );
}
