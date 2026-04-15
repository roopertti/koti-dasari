import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { Database } from './types.js';

export { runMigrations } from './migrate.js';
export type {
  CalendarEventTable,
  Database,
  ReminderTable,
  TodoTable,
  TransportDepartureTable,
  TransportStopTable,
  WeatherCurrentTable,
  WeatherHourlyTable,
} from './types.js';

export function createDatabase(path: string): Kysely<Database> {
  const database = new SQLite(path);
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  database.pragma('foreign_keys = ON');

  const dialect = new SqliteDialect({ database });
  return new Kysely<Database>({ dialect });
}
