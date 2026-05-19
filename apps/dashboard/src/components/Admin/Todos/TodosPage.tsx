import type { Todo } from '@home-dashboard/shared';
import { useState } from 'react';
import { TodosForm } from './TodosForm.js';
import { TodosList } from './TodosList.js';

export function TodosPage() {
  const [editing, setEditing] = useState<Todo | null>(null);
  return (
    <>
      <TodosForm key={editing?.id ?? 'new'} initial={editing} onDone={() => setEditing(null)} />
      <TodosList onEdit={setEditing} />
    </>
  );
}
