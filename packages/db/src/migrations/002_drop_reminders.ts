import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_reminders_acknowledged').ifExists().execute();
  await db.schema.dropIndex('idx_reminders_remind_at').ifExists().execute();
  await db.schema.dropTable('reminders').ifExists().execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('reminders')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`(lower(hex(randomblob(16))))`))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('remind_at', 'text', (col) => col.notNull())
    .addColumn('acknowledged', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('recurring', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createIndex('idx_reminders_remind_at')
    .on('reminders')
    .column('remind_at')
    .execute();

  await db.schema
    .createIndex('idx_reminders_acknowledged')
    .on('reminders')
    .column('acknowledged')
    .execute();
}
