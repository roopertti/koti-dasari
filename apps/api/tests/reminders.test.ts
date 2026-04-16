import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

describe('Reminders API', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  const validReminder = {
    title: 'Take medication',
    description: 'Morning vitamins',
    remindAt: '2026-04-15T08:00:00Z',
    recurring: '0 8 * * *',
  };

  describe('POST /api/reminders', () => {
    it('creates a reminder and returns 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: validReminder,
      });

      expect(res.statusCode).toBe(201);
      const { data } = res.json();
      expect(data.title).toBe('Take medication');
      expect(data.acknowledged).toBe(false);
      expect(data.recurring).toBe('0 8 * * *');
    });

    it('returns 400 when title is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: { remindAt: '2026-04-15T08:00:00Z' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when remindAt is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: { title: 'Test' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/reminders', () => {
    it('returns empty list initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/reminders' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('filters by acknowledged status', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: validReminder,
      });
      const { id } = created.json().data;
      await app.inject({ method: 'PATCH', url: `/api/reminders/${id}/acknowledge` });

      await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: { ...validReminder, title: 'Unacknowledged' },
      });

      const unack = await app.inject({ method: 'GET', url: '/api/reminders?acknowledged=false' });
      expect(unack.json().data).toHaveLength(1);
      expect(unack.json().data[0].title).toBe('Unacknowledged');
    });

    it('filters by date range', async () => {
      await app.inject({ method: 'POST', url: '/api/reminders', payload: validReminder });
      await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: { ...validReminder, remindAt: '2026-05-01T08:00:00Z' },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/reminders?from=2026-04-01&to=2026-04-30T23:59:59Z',
      });
      expect(res.json().data).toHaveLength(1);
    });
  });

  describe('PATCH /api/reminders/:id/acknowledge', () => {
    it('acknowledges a reminder', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: validReminder,
      });
      const { id } = created.json().data;

      const res = await app.inject({ method: 'PATCH', url: `/api/reminders/${id}/acknowledge` });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.acknowledged).toBe(true);
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/reminders/nonexistent/acknowledge',
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/reminders/:id', () => {
    it('updates a reminder', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: validReminder,
      });
      const { id } = created.json().data;

      const res = await app.inject({
        method: 'PUT',
        url: `/api/reminders/${id}`,
        payload: { title: 'Updated reminder' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.title).toBe('Updated reminder');
    });
  });

  describe('DELETE /api/reminders/:id', () => {
    it('deletes a reminder and returns 204', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: validReminder,
      });
      const { id } = created.json().data;

      const res = await app.inject({ method: 'DELETE', url: `/api/reminders/${id}` });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/reminders/nonexistent' });
      expect(res.statusCode).toBe(404);
    });
  });
});
