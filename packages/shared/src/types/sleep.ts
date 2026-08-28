/** Manual override state for the night sleep schedule. */
export type SleepOverrideMode = 'auto' | 'wake' | 'sleep';

/**
 * Night sleep configuration, surfaced to the kiosk (read-only) and editable in
 * the admin UI. Times are local "HH:MM" 24h strings interpreted in the
 * dashboard's timezone (Europe/Helsinki). `overrideUntil` is an ISO 8601 UTC
 * instant; while `override` is not `'auto'` and now is before it, the override
 * wins over the schedule. After it passes, the schedule resumes automatically.
 */
export interface SleepSettings {
  enabled: boolean;
  start: string;
  end: string;
  override: SleepOverrideMode;
  overrideUntil: string | null;
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Parse "HH:MM" into minutes since local midnight, or null if malformed. */
export function parseHm(value: string): number | null {
  const match = HHMM.exec(value);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isValidHm(value: string): boolean {
  return HHMM.test(value);
}

/**
 * Is `nowMinutes` (minutes since local midnight) inside the [start, end) sleep
 * window? Handles windows that cross midnight (e.g. 23:00–06:30). A zero-length
 * or equal start/end window is treated as "never asleep".
 */
export function withinWindow(
  nowMinutes: number,
  startMinutes: number,
  endMinutes: number,
): boolean {
  if (startMinutes === endMinutes) {
    return false;
  }
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // Crosses midnight: asleep from start..24:00 and 00:00..end.
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

/**
 * Resolve whether the display should be asleep right now. A live manual override
 * (set and not yet expired) takes precedence; otherwise the enabled schedule
 * decides. `nowMinutes` must be minutes-since-midnight in the dashboard's
 * timezone (see `helsinkiMinutesOfDay`).
 */
/** Whether a manual override is set and has not yet expired at `now`. */
export function isOverrideActive(settings: SleepSettings, now: Date): boolean {
  if (settings.override === 'auto' || !settings.overrideUntil) {
    return false;
  }
  const until = Date.parse(settings.overrideUntil);
  return Number.isFinite(until) && now.getTime() < until;
}

export function isAsleep(now: Date, nowMinutes: number, settings: SleepSettings): boolean {
  if (isOverrideActive(settings, now)) {
    return settings.override === 'sleep';
  }
  if (!settings.enabled) {
    return false;
  }
  const start = parseHm(settings.start);
  const end = parseHm(settings.end);
  if (start === null || end === null) {
    return false;
  }
  return withinWindow(nowMinutes, start, end);
}
