import { createDatabase, runMigrations, seedSettingsFromEnv } from '@home-dashboard/db';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const db = createDatabase(config.databasePath);

await runMigrations(db);

const seeded = await seedSettingsFromEnv(db, config.settingDefaults);
if (seeded.length > 0) {
  console.log(`[api] Seeded settings from env: ${seeded.join(', ')}`);
}

const app = await buildApp({ db, auth: config.auth });

await app.listen({ port: config.port, host: config.host });
