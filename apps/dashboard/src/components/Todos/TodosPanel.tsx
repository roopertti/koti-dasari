import type { Todo } from '@home-dashboard/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toggleTodo } from '../../api/todos.js';
import { useTodos } from '../../hooks/useTodos.js';
import { t } from '../../i18n/t.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { PanelShell } from '../common/PanelShell/PanelShell.js';
import { Stack } from '../common/Stack/Stack.js';
import { TodoRow } from './TodoRow.js';

export function TodosPanel() {
  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const { data } = useTodos();

  const handleToggle = async (todo: Todo) => {
    setPendingIds((prev) => new Set(prev).add(todo.id));
    try {
      await toggleTodo(todo.id);
      await queryClient.invalidateQueries({ queryKey: ['todos'] });
    } catch (err) {
      console.error('Failed to toggle todo', err);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  };

  return (
    <PanelShell title={t('panel.todos.title')} testId="panel-todos">
      {!data || data.length === 0 ? (
        <PanelMessage variant="empty">{t('panel.todos.empty')}</PanelMessage>
      ) : (
        <Stack as="ul" gap="sm">
          {data.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              pending={pendingIds.has(todo.id)}
              onToggle={handleToggle}
            />
          ))}
        </Stack>
      )}
    </PanelShell>
  );
}
