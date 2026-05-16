import { useQuery } from '@tanstack/react-query';
import { listTodos } from '../api/todos.js';

const REFRESH_MS = 30_000;
const LIMIT = 50;

export function useTodos() {
  return useQuery({
    queryKey: ['todos', { limit: LIMIT }],
    queryFn: ({ signal }) => listTodos({ limit: LIMIT, signal }),
    refetchInterval: REFRESH_MS,
  });
}
