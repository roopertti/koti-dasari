import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

import { runMigrations } from './migrate.js';
import type { Database } from './types.js';

export type {
  CalendarEventTable,
  Database,
  TodoTable,
  TransportDepartureTable,
  TransportStopTable,
  WeatherCurrentTable,
  WeatherHourlyTable,
} from './types.js';
export { runMigrations };

export async function createDatabaseWithRetry(
  path: string,
  maxRetries = 10,
  delayMs = 3000,
): Promise<Kysely<Database>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const db = createDatabase(path);
      await runMigrations(db);
      return db;
    } catch (err) {
      console.error(`[db] Connection attempt ${attempt}/${maxRetries} failed:`, err);
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Unreachable');
}

export function createDatabase(path: string): Kysely<Database> {
  const database = new SQLite(path);
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  database.pragma('foreign_keys = ON');

  const dialect = new SqliteDialect({ database });
  return new Kysely<Database>({ dialect });
}
