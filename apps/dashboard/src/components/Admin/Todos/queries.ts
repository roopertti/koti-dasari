import type { QueryClient } from '@tanstack/react-query';

export const TODOS_KEY = ['admin', 'todos'] as const;
// Kiosk-side key (prefix-matches ['todos', { limit }]) so dashboard refetches.
const KIOSK_TODOS_KEY = ['todos'] as const;

export function invalidateEverywhere(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: TODOS_KEY });
  qc.invalidateQueries({ queryKey: KIOSK_TODOS_KEY });
}
