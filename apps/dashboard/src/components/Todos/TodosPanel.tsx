import { t } from '@home-dashboard/i18n';
import type { Todo } from '@home-dashboard/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toggleTodo } from '../../api/todos.js';
import { useTodos } from '../../hooks/useTodos.js';
import { FocusablePanel } from '../common/FocusablePanel/FocusablePanel.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { Stack } from '../common/Stack/Stack.js';
import { TodoDetailDialog } from './TodoDetailDialog/TodoDetailDialog.js';
import { TodoRow } from './TodoRow/TodoRow.js';

interface TodoListProps {
  todos: Todo[];
  pendingId: string | null;
  onToggle: (todo: Todo) => void;
  onOpen: (todo: Todo) => void;
  detailed?: boolean;
}

function TodoList({ todos, pendingId, onToggle, onOpen, detailed }: TodoListProps) {
  return (
    <Stack as="ul" gap="sm">
      {todos.map((todo) => (
        <TodoRow
          key={todo.id}
          todo={todo}
          pending={pendingId === todo.id}
          onToggle={onToggle}
          onOpen={onOpen}
          detailed={detailed}
        />
      ))}
    </Stack>
  );
}

export function TodosPanel() {
  const queryClient = useQueryClient();
  const { data } = useTodos();
  const [selected, setSelected] = useState<Todo | null>(null);

  const toggle = useMutation({
    mutationFn: (id: string) => toggleTodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    // Kiosk stays toast-free (Phase 6) — log so a failed toggle isn't silently swallowed.
    onError: (err) => console.error('[TodosPanel] toggle failed', err),
  });

  const pendingId = toggle.isPending ? (toggle.variables ?? null) : null;
  const hasTodos = !!data && data.length > 0;

  const listProps = {
    todos: data ?? [],
    pendingId,
    onToggle: (todo: Todo) => toggle.mutate(todo.id),
    onOpen: setSelected,
  };

  return (
    <>
      <FocusablePanel
        title={t('panel.todos.title')}
        testId="panel-todos"
        expandable={hasTodos}
        compact={
          hasTodos ? (
            <TodoList {...listProps} />
          ) : (
            <PanelMessage variant="empty">{t('panel.todos.empty')}</PanelMessage>
          )
        }
        expanded={hasTodos ? <TodoList {...listProps} detailed /> : null}
      />
      <TodoDetailDialog todo={selected} onClose={() => setSelected(null)} />
    </>
  );
}
