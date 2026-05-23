export type Horizon = 'overdue' | 'today' | 'tomorrow' | 'thisWeek';

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
