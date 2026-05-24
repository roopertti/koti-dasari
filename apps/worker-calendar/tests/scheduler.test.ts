import { createDatabase, type Database, runMigrations } from '@home-dashboard/db';
import type { Kysely } from 'kysely';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ParsedIcalEvent } from '../src/ical.js';
import { cleanupStale, STALE_THRESHOLD_MS, upsertFeedEvents } from '../src/scheduler.js';

const FEED = 'ical:finnish-holidays';

function makeEvent(overrides: Partial<ParsedIcalEvent> & { uid: string }): ParsedIcalEvent {
  return {
    uid: overrides.uid,
    title: overrides.title ?? 'Vappu',
    description: overrides.description ?? null,
    location: overrides.location ?? null,
    startTime: overrides.startTime ?? '2099-05-01T00:00:00.000Z',
    endTime: overrides.endTime ?? '2099-05-02T00:00:00.000Z',
    allDay: overrides.allDay ?? true,
  };
}

async function listFeedRows(db: Kysely<Database>) {
  return db
    .selectFrom('calendar_events')
    .selectAll()
    .where('source', '=', FEED)
    .orderBy('ical_uid', 'asc')
    .execute();
}

describe('upsertFeedEvents', () => {
  let db: Kysely<Database>;

  beforeEach(async () => {
    db = createDatabase(':memory:');
    await runMigrations(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('inserts events on first run', async () => {
    await upsertFeedEvents(db, FEED, [
      makeEvent({ uid: 'a@google.com', title: 'Uudenvuodenpäivä' }),
      makeEvent({ uid: 'b@google.com', title: 'Vappu' }),
    ]);

    const rows = await listFeedRows(db);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.title).sort()).toEqual(['Uudenvuodenpäivä', 'Vappu']);
    for (const row of rows) {
      expect(row.source).toBe(FEED);
      expect(row.ical_uid).toBeTruthy();
    }
  });

  it('updates the existing row when the same UID re-appears (preserves id)', async () => {
    await upsertFeedEvents(db, FEED, [
      makeEvent({ uid: 'a@google.com', title: 'Vappu', location: null }),
    ]);
    const [firstRow] = await listFeedRows(db);
    const originalId = firstRow.id;

    await upsertFeedEvents(db, FEED, [
      makeEvent({ uid: 'a@google.com', title: 'Vappu (juhlapäivä)', location: 'Suomi' }),
    ]);

    const rows = await listFeedRows(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(originalId);
    expect(rows[0].title).toBe('Vappu (juhlapäivä)');
    expect(rows[0].location).toBe('Suomi');
  });

  it('deletes future-dated rows whose UID disappears from the feed', async () => {
    await upsertFeedEvents(db, FEED, [
      makeEvent({
        uid: 'keep@google.com',
        startTime: '2099-05-01T00:00:00.000Z',
        endTime: '2099-05-02T00:00:00.000Z',
      }),
      makeEvent({
        uid: 'drop@google.com',
        startTime: '2099-06-01T00:00:00.000Z',
        endTime: '2099-06-02T00:00:00.000Z',
      }),
    ]);
    expect(await listFeedRows(db)).toHaveLength(2);

    await upsertFeedEvents(db, FEED, [
      makeEvent({
        uid: 'keep@google.com',
        startTime: '2099-05-01T00:00:00.000Z',
        endTime: '2099-05-02T00:00:00.000Z',
      }),
    ]);

    const rows = await listFeedRows(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].ical_uid).toBe('keep@google.com');
  });

  it('leaves past-dated rows alone when their UID disappears (cleanupStale handles them)', async () => {
    await db
      .insertInto('calendar_events')
      .values({
        title: 'Joulu 1990',
        description: null,
        location: null,
        start_time: '1990-12-25T00:00:00.000Z',
        end_time: '1990-12-26T00:00:00.000Z',
        all_day: 1,
        color: null,
        source: FEED,
        ical_uid: 'old@google.com',
      })
      .execute();

    await upsertFeedEvents(db, FEED, [makeEvent({ uid: 'unrelated@google.com' })]);

    const rows = await listFeedRows(db);
    expect(rows.map((r) => r.ical_uid).sort()).toEqual(['old@google.com', 'unrelated@google.com']);
  });

  it('does not touch manual events with the same start/end window', async () => {
    await db
      .insertInto('calendar_events')
      .values({
        title: 'My own party',
        description: null,
        location: null,
        start_time: '2099-05-01T18:00:00.000Z',
        end_time: '2099-05-01T22:00:00.000Z',
        all_day: 0,
        color: null,
        source: 'manual',
        ical_uid: null,
      })
      .execute();

    await upsertFeedEvents(db, FEED, [makeEvent({ uid: 'vappu@google.com', title: 'Vappu' })]);

    const manual = await db
      .selectFrom('calendar_events')
      .selectAll()
      .where('source', '=', 'manual')
      .execute();
    expect(manual).toHaveLength(1);
    expect(manual[0].title).toBe('My own party');
  });

  it('is a no-op for an empty event list', async () => {
    await db
      .insertInto('calendar_events')
      .values({
        title: 'Existing',
        description: null,
        location: null,
        start_time: '2099-05-01T00:00:00.000Z',
        end_time: '2099-05-02T00:00:00.000Z',
        all_day: 1,
        color: null,
        source: FEED,
        ical_uid: 'existing@google.com',
      })
      .execute();

    await upsertFeedEvents(db, FEED, []);

    const rows = await listFeedRows(db);
    expect(rows).toHaveLength(1);
  });
});

describe('cleanupStale', () => {
  let db: Kysely<Database>;

  beforeEach(async () => {
    db = createDatabase(':memory:');
    await runMigrations(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('deletes synced rows whose end_time is older than the 90-day threshold', async () => {
    const stale = new Date(Date.now() - STALE_THRESHOLD_MS - 1000).toISOString();
    const fresh = new Date(Date.now() - 1000).toISOString();

    await db
      .insertInto('calendar_events')
      .values([
        {
          title: 'Old holiday',
          description: null,
          location: null,
          start_time: stale,
          end_time: stale,
          all_day: 1,
          color: null,
          source: FEED,
          ical_uid: 'old@google.com',
        },
        {
          title: 'Recent holiday',
          description: null,
          location: null,
          start_time: fresh,
          end_time: fresh,
          all_day: 1,
          color: null,
          source: FEED,
          ical_uid: 'recent@google.com',
        },
      ])
      .execute();

    await cleanupStale(db);

    const remaining = await db
      .selectFrom('calendar_events')
      .select(['ical_uid'])
      .where('source', '=', FEED)
      .execute();
    expect(remaining.map((r) => r.ical_uid)).toEqual(['recent@google.com']);
  });

  it('never deletes manual events, no matter how old', async () => {
    const stale = new Date(Date.now() - STALE_THRESHOLD_MS - 1000).toISOString();

    await db
      .insertInto('calendar_events')
      .values({
        title: 'Ancient manual event',
        description: null,
        location: null,
        start_time: stale,
        end_time: stale,
        all_day: 1,
        color: null,
        source: 'manual',
        ical_uid: null,
      })
      .execute();

    await cleanupStale(db);

    const remaining = await db
      .selectFrom('calendar_events')
      .selectAll()
      .where('source', '=', 'manual')
      .execute();
    expect(remaining).toHaveLength(1);
  });
});
