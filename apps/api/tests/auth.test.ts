import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdminTestApp, createTestApp, newSessionKey } from './helpers.js';

describe('API key gate (/api/*)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp({ auth: { apiKeys: ['kiosk-secret', 'second-pi'] } }));
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  it('rejects requests with no key', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('rejects requests with wrong key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/todos',
      headers: { 'x-api-key': 'nope' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('accepts requests with a known key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/todos',
      headers: { 'x-api-key': 'kiosk-secret' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('accepts any of the configured keys', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/todos',
      headers: { 'x-api-key': 'second-pi' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('exempts /api/health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
  });

  it('exempts /api/admin/* from key check', async () => {
    // Admin disabled -> 503, but never 401 from the api-key plugin
    const res = await app.inject({ method: 'GET', url: '/api/admin/session' });
    expect(res.statusCode).toBe(503);
  });

  it('exempts /api/health even with a query string', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health?check=startup' });
    expect(res.statusCode).toBe(200);
  });
});

describe('API key gate disabled (no keys configured)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  it('allows /api/* without a key when API_KEYS is empty', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(res.statusCode).toBe(200);
  });
});

function cookieHeaderFrom(setCookie: string | string[] | undefined): string {
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!raw) {
    throw new Error('No Set-Cookie header in response');
  }
  // Use the already-percent-encoded value from Set-Cookie; reconstructing from
  // the decoded cookie list would break on values containing ; / + / = etc.
  return raw.split(';')[0];
}

describe('Admin session + settings', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp({
      auth: { adminPin: '4242', adminSessionKey: newSessionKey() },
    }));
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  it('reports unauthenticated session by default', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/session' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.authed).toBe(false);
  });

  it('rejects wrong PIN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { pin: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('login → session → logout round-trip', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { pin: '4242' },
    });
    expect(login.statusCode).toBe(200);
    const cookieHeader = cookieHeaderFrom(login.headers['set-cookie']);

    const session = await app.inject({
      method: 'GET',
      url: '/api/admin/session',
      headers: { cookie: cookieHeader },
    });
    expect(session.json().data.authed).toBe(true);

    const logout = await app.inject({
      method: 'POST',
      url: '/api/admin/logout',
      headers: { cookie: cookieHeader },
    });
    expect(logout.statusCode).toBe(200);
  });

  it('settings GET requires login', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/settings' });
    expect(res.statusCode).toBe(401);
  });

  it('settings PUT updates persisted values', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { pin: '4242' },
    });
    const cookieHeader = cookieHeaderFrom(login.headers['set-cookie']);

    const put = await app.inject({
      method: 'PUT',
      url: '/api/admin/settings',
      headers: { cookie: cookieHeader },
      payload: {
        homeLatitude: 60.2,
        homeLongitude: 24.9,
        transportRadius: 600,
        transportIntervalMs: 240_000,
        weatherIntervalMs: 1_200_000,
      },
    });
    expect(put.statusCode).toBe(200);
    expect(put.json().data).toEqual({
      homeLatitude: 60.2,
      homeLongitude: 24.9,
      transportRadius: 600,
      transportIntervalMs: 240_000,
      weatherIntervalMs: 1_200_000,
    });

    const get = await app.inject({
      method: 'GET',
      url: '/api/admin/settings',
      headers: { cookie: cookieHeader },
    });
    expect(get.json().data.homeLatitude).toBe(60.2);
  });

  it('settings PUT rejects out-of-range values', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { pin: '4242' },
    });
    const cookieHeader = cookieHeaderFrom(login.headers['set-cookie']);

    const put = await app.inject({
      method: 'PUT',
      url: '/api/admin/settings',
      headers: { cookie: cookieHeader },
      payload: { homeLatitude: 999 },
    });
    expect(put.statusCode).toBe(400);
  });
});

describe('seedSettingsFromEnv', () => {
  it('inserts only missing keys; preserves admin-edited values', async () => {
    const { seedSettingsFromEnv, readSettings, writeSettings } = await import('@home-dashboard/db');
    const { app, db } = await createTestApp();
    // Simulate an existing admin edit before seeding.
    await writeSettings(db, { homeLatitude: 60.99 });

    const seeded = await seedSettingsFromEnv(db, {
      homeLatitude: 60.1699,
      homeLongitude: 24.9384,
      transportRadius: 500,
    });
    expect(seeded.sort()).toEqual(['homeLongitude', 'transportRadius']);

    const stored = await readSettings(db);
    expect(stored.homeLatitude).toBe(60.99); // admin edit untouched
    expect(stored.homeLongitude).toBe(24.9384);
    expect(stored.transportRadius).toBe(500);

    // Second run is a no-op.
    const seededAgain = await seedSettingsFromEnv(db, {
      homeLatitude: 60.1699,
      homeLongitude: 24.9384,
      transportRadius: 500,
    });
    expect(seededAgain).toEqual([]);

    await app.close();
    await db.destroy();
  });
});

describe('Admin disabled', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  it('returns 503 on admin routes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { pin: 'x' },
    });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('ADMIN_DISABLED');
  });

  it('returns 503 on admin-gated mutations (POST /api/todos)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'cannot create' },
    });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('ADMIN_DISABLED');
  });

  it('returns 503 on admin-gated mutations (DELETE /api/calendar/events/:id)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/calendar/events/anything',
    });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('ADMIN_DISABLED');
  });

  it('still allows todo toggle (kiosk-only mutation)', async () => {
    // Create a todo directly via DB-bypass would be cleanest; here we just
    // confirm the route reaches its 404 path (no admin gate in the way).
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/todos/nonexistent/toggle',
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('Admin-gated mutations (admin enabled)', () => {
  let app: Awaited<ReturnType<typeof createAdminTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createAdminTestApp>>['db'];
  let cookieHeader: string;

  beforeEach(async () => {
    ({ app, db, cookieHeader } = await createAdminTestApp({
      auth: { apiKeys: ['kiosk-secret'] },
    }));
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  it('rejects POST /api/todos with valid api key but no admin cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'x-api-key': 'kiosk-secret' },
      payload: { title: 'attempted by kiosk' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('rejects PUT /api/calendar/events/:id with no admin cookie', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/calendar/events/anything',
      headers: { 'x-api-key': 'kiosk-secret' },
      payload: { title: 'attempted' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('accepts POST /api/todos with admin cookie + api key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'x-api-key': 'kiosk-secret', cookie: cookieHeader },
      payload: { title: 'admin-authored' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('allows PATCH /api/todos/:id/toggle with just the api key (no admin cookie)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'x-api-key': 'kiosk-secret', cookie: cookieHeader },
      payload: { title: 'toggle target' },
    });
    const { id } = created.json().data;

    const toggled = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${id}/toggle`,
      headers: { 'x-api-key': 'kiosk-secret' },
    });
    expect(toggled.statusCode).toBe(200);
    expect(toggled.json().data.completed).toBe(true);
  });
});
