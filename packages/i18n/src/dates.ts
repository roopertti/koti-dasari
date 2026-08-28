import { TIMEZONE } from './locale.js';

export type Horizon = 'overdue' | 'today' | 'tomorrow' | 'thisWeek';

const helsinkiHmParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * Minutes since midnight (0–1439) in the dashboard's timezone (Helsinki),
 * independent of where the host runs. Used by the sleep-window predicate.
 */
export function helsinkiMinutesOfDay(date: Date): number {
  const parts = helsinkiHmParts.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  // Some engines render midnight as 24; normalize back to 0.
  return (hour % 24) * 60 + minute;
}

/**
 * Earliest future instant whose Helsinki minute-of-day equals `minutesA` or
 * `minutesB` — i.e. the next sleep-schedule boundary after `now`. Steps a minute
 * at a time (DST-safe) and is bounded to 48h; a valid boundary is always < 24h
 * away. Used to compute when a manual sleep override should auto-expire.
 */
export function nextBoundaryInstant(now: Date, minutesA: number, minutesB: number): Date {
  for (let i = 1; i <= 48 * 60; i++) {
    const candidate = new Date(now.getTime() + i * 60_000);
    const minutes = helsinkiMinutesOfDay(candidate);
    if (minutes === minutesA || minutes === minutesB) {
      return candidate;
    }
  }
  return new Date(now.getTime() + 24 * 60 * 60_000);
}

/**
 * Midnight (00:00) at the start of `date`'s calendar day, in the runtime's
 * local timezone. Used as a stable per-day anchor for day-level math.
 */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whole-calendar-day delta between two `Date`s in the runtime's local zone.
 * Positive when `target` is after `base`. Handles DST by anchoring at midnight.
 */
export function diffDays(target: Date, base: Date): number {
  const a = startOfLocalDay(target).getTime();
  const b = startOfLocalDay(base).getTime();
  return Math.round((a - b) / 86_400_000);
}

/**
 * Parse a `YYYY-MM-DD` string (e.g. a todo `dueDate`, a calendar day-group key,
 * or the date portion of an all-day event's `startTime`) as midnight in the
 * runtime's local zone. Accepts longer strings — only the first 10 chars are read.
 */
export function parseLocalDate(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd.slice(0, 10)}T00:00:00`);
}

/**
 * Resolve the "starts at" instant for a calendar event. All-day events are
 * anchored at midnight on their start date; timed events use their full
 * ISO timestamp as stored.
 */
export function parseEventStart(event: { allDay: boolean; startTime: string }): Date {
  return event.allDay ? parseLocalDate(event.startTime) : new Date(event.startTime);
}

/**
 * Map a day offset (relative to "today", as produced by `diffDays`) to a
 * coarse rail horizon. Returns `null` when the offset falls outside the
 * `soonDays`-day window so callers can drop it.
 */
export function horizonFromOffset(daysFromToday: number, soonDays = 7): Horizon | null {
  if (daysFromToday < 0) {
    return 'overdue';
  }
  if (daysFromToday === 0) {
    return 'today';
  }
  if (daysFromToday === 1) {
    return 'tomorrow';
  }
  if (daysFromToday <= soonDays) {
    return 'thisWeek';
  }
  return null;
}

/**
 * Convert a Digitransit departure (service day + seconds since midnight in
 * the local Helsinki timezone) into a `Date`.
 */
export function departureToDate(serviceDay: string, secondsSinceMidnight: number): Date {
  const base = new Date(`${serviceDay}T00:00:00`);
  return new Date(base.getTime() + secondsSinceMidnight * 1000);
}

/**
 * Format seconds since midnight as HH:MM.
 */
export function formatDepartureTime(secondsSinceMidnight: number): string {
  const hours = Math.floor(secondsSinceMidnight / 3600) % 24;
  const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
