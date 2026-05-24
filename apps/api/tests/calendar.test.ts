import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdminTestApp } from './helpers.js';

describe('Calendar Events API', () => {
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

  const validEvent = {
    title: 'Test Event',
    description: 'A test event',
    location: 'Office',
    startTime: '2026-04-15T09:00:00Z',
    endTime: '2026-04-15T10:00:00Z',
    allDay: false,
    color: '#ff0000',
  };

  describe('POST /api/calendar/events', () => {
    it('creates an event and returns 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: validEvent,
      });

      expect(res.statusCode).toBe(201);
      const { data } = res.json();
      expect(data.id).toBeDefined();
      expect(data.title).toBe('Test Event');
      expect(data.startTime).toBe('2026-04-15T09:00:00Z');
      expect(data.allDay).toBe(false);
    });

    it('returns 400 when title is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: { ...validEvent, title: '' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when endTime is before startTime', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: { ...validEvent, endTime: '2026-04-15T08:00:00Z' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/calendar/events', () => {
    it('returns empty list initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/calendar/events' });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('returns created events', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: validEvent,
      });

      const res = await app.inject({ method: 'GET', url: '/api/calendar/events' });
      expect(res.json().data).toHaveLength(1);
    });

    it('filters by date range', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: validEvent,
      });
      await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: {
          ...validEvent,
          startTime: '2026-05-01T09:00:00Z',
          endTime: '2026-05-01T10:00:00Z',
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/calendar/events?from=2026-04-01&to=2026-04-30T23:59:59Z',
      });
      expect(res.json().data).toHaveLength(1);
    });
  });

  async function insertSyncedEvent(overrides: Partial<{ id: string; ical_uid: string }> = {}) {
    const id = overrides.id ?? 'synced-1';
    await db
      .insertInto('calendar_events')
      .values({
        id,
        title: 'Vappu',
        description: null,
        location: null,
        start_time: '2026-05-01T00:00:00.000Z',
        end_time: '2026-05-02T00:00:00.000Z',
        all_day: 1,
        color: null,
        source: 'ical:finnish-holidays',
        ical_uid: overrides.ical_uid ?? '20260501_bbb@google.com',
      })
      .execute();
    return id;
  }

  describe('GET /api/calendar/events/:id', () => {
    it('returns a single event', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: validEvent,
      });
      const { id } = created.json().data;

      const res = await app.inject({ method: 'GET', url: `/api/calendar/events/${id}` });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.title).toBe('Test Event');
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/calendar/events/nonexistent' });
      expect(res.statusCode).toBe(404);
    });

    it('exposes source on responses but hides icalUid', async () => {
      const id = await insertSyncedEvent();

      const single = await app.inject({ method: 'GET', url: `/api/calendar/events/${id}` });
      expect(single.statusCode).toBe(200);
      const singleData = single.json().data;
      expect(singleData.source).toBe('ical:finnish-holidays');
      expect(singleData).not.toHaveProperty('icalUid');
      expect(singleData).not.toHaveProperty('ical_uid');

      const list = await app.inject({ method: 'GET', url: '/api/calendar/events' });
      const [row] = list.json().data;
      expect(row.source).toBe('ical:finnish-holidays');
      expect(row).not.toHaveProperty('icalUid');
    });

    it('defaults source to "manual" for events created via POST', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: validEvent,
      });
      expect(created.json().data.source).toBe('manual');
    });
  });

  describe('PUT /api/calendar/events/:id', () => {
    it('updates an event', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: validEvent,
      });
      const { id } = created.json().data;

      const res = await app.inject({
        method: 'PUT',
        url: `/api/calendar/events/${id}`,
        headers: { cookie: cookieHeader },
        payload: { title: 'Updated' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.title).toBe('Updated');
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/calendar/events/nonexistent',
        headers: { cookie: cookieHeader },
        payload: { title: 'Updated' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 READ_ONLY_SOURCE when updating a synced event', async () => {
      const id = await insertSyncedEvent();

      const res = await app.inject({
        method: 'PUT',
        url: `/api/calendar/events/${id}`,
        headers: { cookie: cookieHeader },
        payload: { title: 'Tampered' },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('READ_ONLY_SOURCE');

      // Row is untouched.
      const after = await app.inject({ method: 'GET', url: `/api/calendar/events/${id}` });
      expect(after.json().data.title).toBe('Vappu');
    });
  });

  describe('DELETE /api/calendar/events/:id', () => {
    it('deletes an event and returns 204', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/calendar/events',
        headers: { cookie: cookieHeader },
        payload: validEvent,
      });
      const { id } = created.json().data;

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/calendar/events/${id}`,
        headers: { cookie: cookieHeader },
      });
      expect(res.statusCode).toBe(204);

      const get = await app.inject({ method: 'GET', url: `/api/calendar/events/${id}` });
      expect(get.statusCode).toBe(404);
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/calendar/events/nonexistent',
        headers: { cookie: cookieHeader },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 READ_ONLY_SOURCE when deleting a synced event', async () => {
      const id = await insertSyncedEvent();

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/calendar/events/${id}`,
        headers: { cookie: cookieHeader },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('READ_ONLY_SOURCE');

      // Row is still present.
      const after = await app.inject({ method: 'GET', url: `/api/calendar/events/${id}` });
      expect(after.statusCode).toBe(200);
    });
  });
});
