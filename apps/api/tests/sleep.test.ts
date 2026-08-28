import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdminTestApp } from './helpers.js';

describe('sleep settings', () => {
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

  it('GET /api/settings/display returns sleep defaults (no key gate configured)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/settings/display' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.sleep).toEqual({
      enabled: false,
      start: '23:00',
      end: '06:30',
      override: 'auto',
      overrideUntil: null,
    });
  });

  it('PUT /api/admin/sleep updates the config and is reflected by the display read', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/sleep',
      headers: { cookie: cookieHeader },
      payload: { enabled: true, start: '22:30', end: '07:00' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toMatchObject({ enabled: true, start: '22:30', end: '07:00' });

    const display = await app.inject({ method: 'GET', url: '/api/settings/display' });
    expect(display.json().data.sleep).toMatchObject({
      enabled: true,
      start: '22:30',
      end: '07:00',
    });
  });

  it('PUT /api/admin/sleep rejects a malformed time', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/sleep',
      headers: { cookie: cookieHeader },
      payload: { start: '7:5' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('PUT /api/admin/sleep requires admin auth', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/sleep',
      payload: { enabled: true },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/admin/sleep/override sets a forced mode with an expiry', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/sleep/override',
      headers: { cookie: cookieHeader },
      payload: { mode: 'sleep' },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.override).toBe('sleep');
    expect(typeof data.overrideUntil).toBe('string');
    expect(Date.parse(data.overrideUntil)).toBeGreaterThan(Date.now());
  });

  it('POST /api/admin/sleep/override mode=auto clears the override', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/admin/sleep/override',
      headers: { cookie: cookieHeader },
      payload: { mode: 'wake' },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/sleep/override',
      headers: { cookie: cookieHeader },
      payload: { mode: 'auto' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toMatchObject({ override: 'auto', overrideUntil: null });
  });

  it('POST /api/admin/sleep/override rejects an unknown mode', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/sleep/override',
      headers: { cookie: cookieHeader },
      payload: { mode: 'nope' },
    });
    expect(res.statusCode).toBe(400);
  });
});
