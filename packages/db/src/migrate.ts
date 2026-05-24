import type { Kysely } from 'kysely';
import { type Migration, type MigrationProvider, Migrator } from 'kysely/migration';
import * as initial from './migrations/001_initial.js';
import * as dropReminders from './migrations/002_drop_reminders.js';
import * as settings from './migrations/003_settings.js';
import * as electricityPrices from './migrations/004_electricity_prices.js';
import * as calendarSource from './migrations/005_calendar_source.js';
import type { Database } from './types.js';

const migrations: Record<string, Migration> = {
  '001_initial': initial,
  '002_drop_reminders': dropReminders,
  '003_settings': settings,
  '004_electricity_prices': electricityPrices,
  '005_calendar_source': calendarSource,
};

class StaticMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return migrations;
  }
}

export async function runMigrations(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new StaticMigrationProvider(),
  });

  const { error, results } = await migrator.migrateToLatest();

  if (results) {
    for (const result of results) {
      if (result.status === 'Success') {
        console.log(`Migration "${result.migrationName}" executed successfully`);
      } else if (result.status === 'Error') {
        console.error(`Migration "${result.migrationName}" failed`);
      }
    }
  }

  if (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
