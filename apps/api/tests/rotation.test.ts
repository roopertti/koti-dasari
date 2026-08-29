import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdminTestApp } from './helpers.js';

describe('rotation settings', () => {
  let app: Awaited<ReturnType<typeof createAdminTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createAdminTestApp>>['db'];
  let cookieHeader: string;

  beforeEach(async () => {
    ({ app, db, cookieHeader } = await createAdminTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  it('GET /api/settings/display returns rotation defaults', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/settings/display' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.rotation).toEqual({
      enabled: true,
      intervalMs: 30_000,
      idleMs: 120_000,
    });
  });

  it('PUT /api/admin/rotation updates the config and is reflected by the display read', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/rotation',
      headers: { cookie: cookieHeader },
      payload: { enabled: false, intervalMs: 45_000, idleMs: 300_000 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual({ enabled: false, intervalMs: 45_000, idleMs: 300_000 });

    const display = await app.inject({ method: 'GET', url: '/api/settings/display' });
    expect(display.json().data.rotation).toEqual({
      enabled: false,
      intervalMs: 45_000,
      idleMs: 300_000,
    });
  });

  it('PUT /api/admin/rotation applies a partial patch without clobbering the rest', async () => {
    await app.inject({
      method: 'PUT',
      url: '/api/admin/rotation',
      headers: { cookie: cookieHeader },
      payload: { intervalMs: 60_000 },
    });

    const display = await app.inject({ method: 'GET', url: '/api/settings/display' });
    expect(display.json().data.rotation).toEqual({
      enabled: true,
      intervalMs: 60_000,
      idleMs: 120_000,
    });
  });

  it('PUT /api/admin/rotation rejects an interval below the allowed minimum', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/rotation',
      headers: { cookie: cookieHeader },
      payload: { intervalMs: 100 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('PUT /api/admin/rotation rejects an idle timeout above the allowed maximum', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/rotation',
      headers: { cookie: cookieHeader },
      payload: { idleMs: 99_999_999 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('PUT /api/admin/rotation requires admin auth', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/rotation',
      payload: { enabled: false },
    });
    expect(res.statusCode).toBe(401);
  });
});
