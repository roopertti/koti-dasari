import { t } from '@home-dashboard/i18n';
import type { Todo } from '@home-dashboard/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleTodo } from '../../api/todos.js';
import { useTodos } from '../../hooks/useTodos.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { PanelShell } from '../common/PanelShell/PanelShell.js';
import { Stack } from '../common/Stack/Stack.js';
import { TodoRow } from './TodoRow/TodoRow.js';

export function TodosPanel() {
  const queryClient = useQueryClient();
  const { data } = useTodos();

  const toggle = useMutation({
    mutationFn: (id: string) => toggleTodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    // Kiosk stays toast-free (Phase 6) — log so a failed toggle isn't silently swallowed.
    onError: (err) => console.error('[TodosPanel] toggle failed', err),
  });

  const isPending = (todo: Todo) => toggle.isPending && toggle.variables === todo.id;

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
              pending={isPending(todo)}
              onToggle={(t) => toggle.mutate(t.id)}
            />
          ))}
        </Stack>
      )}
    </PanelShell>
  );
}
