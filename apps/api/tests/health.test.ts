import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

describe('GET /api/health', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  it('returns ok status', async () => {
    ({ app, db } = await createTestApp());
    const res = await app.inject({ method: 'GET', url: '/api/health' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
  });
});
