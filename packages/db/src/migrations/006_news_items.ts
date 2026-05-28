import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('news_items')
    .addColumn('guid', 'text', (col) => col.primaryKey())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('link', 'text', (col) => col.notNull())
    .addColumn('summary', 'text')
    .addColumn('published_at', 'text', (col) => col.notNull())
    .addColumn('source', 'text', (col) => col.notNull().defaultTo('yle'))
    .addColumn('fetched_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createIndex('idx_news_items_published_at')
    .on('news_items')
    .column('published_at')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_news_items_published_at').ifExists().execute();
  await db.schema.dropTable('news_items').ifExists().execute();
}
