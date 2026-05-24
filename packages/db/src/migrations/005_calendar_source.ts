import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('calendar_events')
    .addColumn('source', 'text', (col) => col.notNull().defaultTo('manual'))
    .execute();

  await db.schema.alterTable('calendar_events').addColumn('ical_uid', 'text').execute();

  await db.schema
    .createIndex('idx_calendar_events_source_uid')
    .on('calendar_events')
    .columns(['source', 'ical_uid'])
    .unique()
    .where(sql.ref('ical_uid'), 'is not', null)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_calendar_events_source_uid').ifExists().execute();
  await db.schema.alterTable('calendar_events').dropColumn('ical_uid').execute();
  await db.schema.alterTable('calendar_events').dropColumn('source').execute();
}
