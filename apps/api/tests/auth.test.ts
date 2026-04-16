import { createDatabase, runMigrations } from '@home-dashboard/db';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('API Key Authentication', () => {
  it('allows all requests when API_KEY is not set', async () => {
    const db = createDatabase(':memory:');
    await runMigrations(db);
    const app = await buildApp({ db });

    const res = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(res.statusCode).toBe(200);

    await app.close();
    await db.destroy();
  });

  it('rejects requests without x-api-key header when API_KEY is set', async () => {
    const db = createDatabase(':memory:');
    await runMigrations(db);
    const app = await buildApp({ db, apiKey: 'test-secret' });

    const res = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');

    await app.close();
    await db.destroy();
  });

  it('allows requests with correct x-api-key header', async () => {
    const db = createDatabase(':memory:');
    await runMigrations(db);
    const app = await buildApp({ db, apiKey: 'test-secret' });

    const res = await app.inject({
      method: 'GET',
      url: '/api/todos',
      headers: { 'x-api-key': 'test-secret' },
    });
    expect(res.statusCode).toBe(200);

    await app.close();
    await db.destroy();
  });

  it('always allows /api/health without auth', async () => {
    const db = createDatabase(':memory:');
    await runMigrations(db);
    const app = await buildApp({ db, apiKey: 'test-secret' });

    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);

    await app.close();
    await db.destroy();
  });
});
