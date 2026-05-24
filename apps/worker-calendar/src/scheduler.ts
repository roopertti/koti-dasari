import type { Database } from '@home-dashboard/db';
import { TIMEZONE } from '@home-dashboard/i18n';
import { FINNISH_HOLIDAYS_SOURCE } from '@home-dashboard/shared';
import type { Kysely } from 'kysely';
import { fetchAndParseIcal, type ParsedIcalEvent } from './ical.js';

export const STALE_THRESHOLD_MS = 90 * 24 * 60 * 60_000;

export const FINNISH_HOLIDAYS_FEED =
  'https://calendar.google.com/calendar/ical/fi.finnish%23holiday%40group.v.calendar.google.com/public/basic.ics';

export { FINNISH_HOLIDAYS_SOURCE };

export interface CalendarFeed {
  source: `ical:${string}`;
  url: string;
}

export interface CalendarSchedulerConfig {
  db: Kysely<Database>;
  feeds?: CalendarFeed[];
}

export function startScheduler(config: CalendarSchedulerConfig): () => void {
  const { db } = config;
  const feeds: CalendarFeed[] = config.feeds ?? [
    { source: FINNISH_HOLIDAYS_SOURCE, url: FINNISH_HOLIDAYS_FEED },
  ];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = false;

  async function tick() {
    if (running || stopped) {
      return;
    }
    running = true;

    try {
      for (const feed of feeds) {
        console.log(`[calendar] Fetching feed ${feed.source} (${feed.url})`);
        const events = await fetchAndParseIcal({ url: feed.url });
        await upsertFeedEvents(db, feed.source, events);
        console.log(`[calendar] Feed ${feed.source}: ${events.length} events upserted`);
      }
      await cleanupStale(db);
    } catch (err) {
      console.error('[calendar] Fetch cycle failed:', err);
    } finally {
      running = false;
      if (!stopped) {
        const delay = millisUntilNext3amHelsinki(new Date());
        console.log(
          `[calendar] Next fetch in ${Math.round(delay / 60_000)} min (~03:00 Europe/Helsinki)`,
        );
        timer = setTimeout(tick, delay);
      }
    }
  }

  tick();

  return () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

/**
 * Daily holiday/flag-day feeds don't change more than once a year. Fire once on
 * startup, then schedule the next tick at the next 03:00 Europe/Helsinki — same
 * slot as the nightly DB backup, so no useful work competes with it.
 */
export function millisUntilNext3amHelsinki(now: Date): number {
  const helsinkiNow = zonedDate(now, TIMEZONE);
  const helsinkiNext = new Date(helsinkiNow);
  helsinkiNext.setHours(3, 0, 0, 0);
  if (helsinkiNext <= helsinkiNow) {
    helsinkiNext.setDate(helsinkiNext.getDate() + 1);
  }
  return helsinkiNext.getTime() - helsinkiNow.getTime();
}

function zonedDate(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const { type, value } of parts) {
    map[type] = value;
  }
  const hour = map.hour === '24' ? '00' : map.hour;
  return new Date(`${map.year}-${map.month}-${map.day}T${hour}:${map.minute}:${map.second}`);
}

export async function upsertFeedEvents(
  db: Kysely<Database>,
  source: string,
  events: ParsedIcalEvent[],
): Promise<void> {
  if (events.length === 0) {
    return;
  }
  const now = new Date().toISOString();
  const seenUids = new Set(events.map((e) => e.uid));

  await db.transaction().execute(async (trx) => {
    for (const event of events) {
      // ON CONFLICT targets the partial unique index idx_calendar_events_source_uid;
      // SQLite requires the same WHERE predicate to match the partial index.
      await trx
        .insertInto('calendar_events')
        .values({
          title: event.title,
          description: event.description,
          location: event.location,
          start_time: event.startTime,
          end_time: event.endTime,
          all_day: event.allDay ? 1 : 0,
          source,
          ical_uid: event.uid,
        })
        .onConflict((oc) =>
          oc
            .columns(['source', 'ical_uid'])
            .where('ical_uid', 'is not', null)
            .doUpdateSet({
              title: event.title,
              description: event.description,
              location: event.location,
              start_time: event.startTime,
              end_time: event.endTime,
              all_day: event.allDay ? 1 : 0,
              updated_at: now,
            }),
        )
        .execute();
    }

    // Delete rows for this feed whose UID is no longer present in the feed —
    // but only future ones; past holidays drop via cleanupStale below.
    const futureCutoff = new Date().toISOString();
    const allForFeed = await trx
      .selectFrom('calendar_events')
      .select(['id', 'ical_uid'])
      .where('source', '=', source)
      .where('end_time', '>', futureCutoff)
      .execute();
    const toDelete = allForFeed
      .filter((row) => row.ical_uid && !seenUids.has(row.ical_uid))
      .map((row) => row.id);
    if (toDelete.length > 0) {
      await trx.deleteFrom('calendar_events').where('id', 'in', toDelete).execute();
    }
  });
}

export async function cleanupStale(db: Kysely<Database>): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
  await db
    .deleteFrom('calendar_events')
    .where('source', '!=', 'manual')
    .where('end_time', '<', cutoff)
    .execute();
}
