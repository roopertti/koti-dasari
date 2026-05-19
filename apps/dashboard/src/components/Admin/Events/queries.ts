import type { QueryClient } from '@tanstack/react-query';

export const EVENTS_KEY = ['admin', 'events'] as const;
// Kiosk-side key; matches anything under ['calendar', 'events', ...] so the
// dashboard panel picks up admin edits on its next render/refetch.
const KIOSK_EVENTS_KEY = ['calendar', 'events'] as const;

export function invalidateEverywhere(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: EVENTS_KEY });
  qc.invalidateQueries({ queryKey: KIOSK_EVENTS_KEY });
}
