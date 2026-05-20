import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('electricity_prices')
    .addColumn('hour_start', 'text', (col) => col.primaryKey())
    .addColumn('price_cents_per_kwh', 'real', (col) => col.notNull())
    .addColumn('fetched_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('electricity_prices').ifExists().execute();
}
