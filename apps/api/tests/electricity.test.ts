import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

describe('Electricity API', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  describe('GET /api/electricity/prices', () => {
    it('returns empty list when no prices exist', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/electricity/prices' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('returns all prices in ascending order with camelCase fields', async () => {
      await db
        .insertInto('electricity_prices')
        .values([
          { hour_start: '2026-05-20T12:00:00.000Z', price_cents_per_kwh: 7.5 },
          { hour_start: '2026-05-20T10:00:00.000Z', price_cents_per_kwh: 3.2 },
          { hour_start: '2026-05-20T11:00:00.000Z', price_cents_per_kwh: 5.1 },
        ])
        .execute();

      const res = await app.inject({ method: 'GET', url: '/api/electricity/prices' });
      expect(res.statusCode).toBe(200);
      const { data } = res.json();
      expect(data).toHaveLength(3);
      expect(data[0]).toMatchObject({
        hourStart: '2026-05-20T10:00:00.000Z',
        priceCentsPerKwh: 3.2,
      });
      expect(data[0].fetchedAt).toBeDefined();
      expect(data[1].hourStart).toBe('2026-05-20T11:00:00.000Z');
      expect(data[2].hourStart).toBe('2026-05-20T12:00:00.000Z');
    });

    it('filters by from and to (inclusive)', async () => {
      await db
        .insertInto('electricity_prices')
        .values([
          { hour_start: '2026-05-20T09:00:00.000Z', price_cents_per_kwh: 1 },
          { hour_start: '2026-05-20T10:00:00.000Z', price_cents_per_kwh: 2 },
          { hour_start: '2026-05-20T11:00:00.000Z', price_cents_per_kwh: 3 },
          { hour_start: '2026-05-20T12:00:00.000Z', price_cents_per_kwh: 4 },
        ])
        .execute();

      const res = await app.inject({
        method: 'GET',
        url: '/api/electricity/prices?from=2026-05-20T10:00:00.000Z&to=2026-05-20T11:00:00.000Z',
      });
      expect(res.statusCode).toBe(200);
      const { data } = res.json();
      expect(data).toHaveLength(2);
      expect(data.map((d: { hourStart: string }) => d.hourStart)).toEqual([
        '2026-05-20T10:00:00.000Z',
        '2026-05-20T11:00:00.000Z',
      ]);
    });
  });
});
