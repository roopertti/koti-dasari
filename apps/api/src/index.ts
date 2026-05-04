import { createDatabase, runMigrations } from '@home-dashboard/db';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const db = createDatabase(config.databasePath);

await runMigrations(db);

const app = await buildApp({ db });

await app.listen({ port: config.port, host: config.host });
