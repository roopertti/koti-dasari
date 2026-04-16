import { createDatabase, runMigrations } from '@home-dashboard/db';
import { buildApp } from '../src/app.js';

export async function createTestApp() {
  const db = createDatabase(':memory:');
  await runMigrations(db);
  const app = await buildApp({ db });
  return { app, db };
}
