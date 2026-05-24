import ICAL from 'ical.js';
import { z } from 'zod';

export interface ParsedIcalEvent {
  uid: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

export interface FetchIcalOptions {
  url: string;
  timeoutMs?: number;
}

export async function fetchAndParseIcal(opts: FetchIcalOptions): Promise<ParsedIcalEvent[]> {
  const { url, timeoutMs = 15_000 } = opts;
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    throw new Error(`iCal fetch failed: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseIcal(text);
}

export function parseIcal(text: string): ParsedIcalEvent[] {
  const jcal = ICAL.parse(text);
  const root = new ICAL.Component(jcal);
  const vevents = root.getAllSubcomponents('vevent');

  const results: ParsedIcalEvent[] = [];
  for (const vevent of vevents) {
    const parsed = parseVevent(vevent);
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
}

const veventShape = z.object({
  uid: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean(),
});

function parseVevent(vevent: ICAL.Component): ParsedIcalEvent | null {
  const uid = vevent.getFirstPropertyValue('uid');
  const summary = vevent.getFirstPropertyValue('summary');
  const dtstart = vevent.getFirstPropertyValue('dtstart') as ICAL.Time | null;
  const dtend = vevent.getFirstPropertyValue('dtend') as ICAL.Time | null;

  if (!uid || !summary || !dtstart) {
    return null;
  }

  const allDay = dtstart.isDate;
  let startTime: string;
  let endTime: string;
  if (allDay) {
    startTime = dateOnlyToUtcMidnightIso(dtstart);
    endTime = dtend
      ? dateOnlyToUtcMidnightIso(dtend)
      : dateOnlyToUtcMidnightIso(addDays(dtstart, 1));
  } else {
    const startJs = dtstart.toJSDate();
    const endJs = dtend ? dtend.toJSDate() : new Date(startJs.getTime() + 60 * 60_000);
    startTime = startJs.toISOString();
    endTime = endJs.toISOString();
  }

  const candidate = {
    uid: String(uid),
    title: String(summary),
    description: stringOrNull(vevent.getFirstPropertyValue('description')),
    location: stringOrNull(vevent.getFirstPropertyValue('location')),
    startTime,
    endTime,
    allDay,
  };

  const parsed = veventShape.safeParse(candidate);
  if (!parsed.success) {
    console.warn(
      `[calendar] Skipping invalid VEVENT (uid=${candidate.uid}): ${parsed.error.message}`,
    );
    return null;
  }
  return parsed.data;
}

function stringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const str = String(value).trim();
  return str.length === 0 ? null : str;
}

/**
 * For all-day VEVENTs, DTSTART/DTEND are floating dates (no time, no zone).
 * ICAL.Time exposes the calendar y/m/d directly — use those (not `toJSDate()`,
 * which returns local midnight and would shift the date in non-UTC zones).
 * Persist as UTC midnight so the kiosk's `YYYY-MM-DD` slice resolves to the
 * intended local day regardless of viewer timezone.
 */
function dateOnlyToUtcMidnightIso(t: ICAL.Time): string {
  return new Date(Date.UTC(t.year, t.month - 1, t.day, 0, 0, 0, 0)).toISOString();
}

function addDays(t: ICAL.Time, days: number): ICAL.Time {
  const next = t.clone();
  next.addDuration(ICAL.Duration.fromSeconds(days * 24 * 60 * 60));
  return next;
}
