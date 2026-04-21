import type { Todo } from '@home-dashboard/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { listTodos, toggleTodo } from '../../api/todos.js';
import { PanelMessage } from '../common/PanelMessage.js';
import { PanelShell } from '../common/PanelShell.js';
import { Stack } from '../common/Stack.js';
import { TodoRow } from './TodoRow.js';

const REFRESH_MS = 30_000;
const TODOS_KEY = ['todos', { limit: 50 }] as const;

export function TodosPanel() {
  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: TODOS_KEY,
    queryFn: ({ signal }) => listTodos({ limit: 50, signal }),
    refetchInterval: REFRESH_MS,
  });

  const handleToggle = async (todo: Todo) => {
    setPendingIds((prev) => new Set(prev).add(todo.id));
    try {
      await toggleTodo(todo.id);
      await queryClient.invalidateQueries({ queryKey: ['todos'] });
    } catch (err) {
      // TODO: surface failure in the UI (toast or row-level error state).
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
    <PanelShell title="Todos" testId="panel-todos">
      {!data || data.length === 0 ? (
        <PanelMessage variant="empty">No todos</PanelMessage>
      ) : (
        <Stack as="ul" gap="tight">
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
