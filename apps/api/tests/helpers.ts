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

export const TEST_ADMIN_PIN = '4242';

export async function loginAsAdmin(
  app: Awaited<ReturnType<typeof createTestApp>>['app'],
  pin: string = TEST_ADMIN_PIN,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/admin/login',
    payload: { pin },
  });
  const setCookie = res.headers['set-cookie'];
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!raw) {
    throw new Error('No Set-Cookie header in admin login response');
  }
  // Use the already-percent-encoded value from Set-Cookie; reconstructing from
  // the decoded cookie list would break on values containing ; / + / = etc.
  return raw.split(';')[0];
}

// Convenience for the bulk of API tests: builds an app with admin enabled,
// logs in, and hands back the cookie header to use on mutating requests.
export async function createAdminTestApp(options: TestAppOptions = {}) {
  const result = await createTestApp({
    ...options,
    auth: {
      adminPin: TEST_ADMIN_PIN,
      adminSessionKey: newSessionKey(),
      ...options.auth,
    },
  });
  const cookieHeader = await loginAsAdmin(result.app);
  return { ...result, cookieHeader };
}
