import type {
  CreateTodoInput,
  ReorderTodoItem,
  Todo,
  TodoPriority,
  UpdateTodoInput,
} from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export function listTodos(
  params: {
    completed?: boolean;
    priority?: TodoPriority;
    limit?: number;
    signal?: AbortSignal;
  } = {},
): Promise<Todo[]> {
  const { signal, ...query } = params;
  return apiRequest<Todo[]>('/todos', { query, signal });
}

export function createTodo(body: CreateTodoInput): Promise<Todo> {
  return apiRequest<Todo>('/todos', { method: 'POST', body });
}

export function updateTodo(id: string, body: UpdateTodoInput): Promise<Todo> {
  return apiRequest<Todo>(`/todos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
}

export function toggleTodo(id: string): Promise<Todo> {
  return apiRequest<Todo>(`/todos/${encodeURIComponent(id)}/toggle`, {
    method: 'PATCH',
  });
}

export function reorderTodos(items: ReorderTodoItem[]): Promise<void> {
  return apiRequest<void>('/todos/reorder', { method: 'PUT', body: { items } });
}

export function deleteTodo(id: string): Promise<void> {
  return apiRequest<void>(`/todos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
