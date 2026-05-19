import { randomBytes } from 'node:crypto';
import { createDatabase, runMigrations } from '@home-dashboard/db';
import { buildApp } from '../src/app.js';
import type { AuthConfig } from '../src/config.js';

export interface TestAppOptions {
  auth?: Partial<AuthConfig>;
}

export async function createTestApp(options: TestAppOptions = {}) {
  const db = createDatabase(':memory:');
  await runMigrations(db);
  const auth: AuthConfig = {
    apiKeys: options.auth?.apiKeys ?? [],
    adminPin: options.auth?.adminPin ?? null,
    adminSessionKey: options.auth?.adminSessionKey ?? null,
  };
  const app = await buildApp({ db, auth });
  return { app, db };
}

export function newSessionKey(): Buffer {
  return randomBytes(32);
}
