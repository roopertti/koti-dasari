import { useQuery } from '@tanstack/react-query';
import { listCalendarEvents } from '../api/calendar.js';

const REFRESH_MS = 60_000;
const LOOKAHEAD_DAYS = 14;

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar', 'events', { lookaheadDays: LOOKAHEAD_DAYS }],
    queryFn: ({ signal }) => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + LOOKAHEAD_DAYS);
      return listCalendarEvents({
        from: from.toISOString(),
        to: to.toISOString(),
        limit: 50,
        signal,
      });
    },
    refetchInterval: REFRESH_MS,
  });
}
