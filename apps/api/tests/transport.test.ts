import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

describe('Transport API', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  async function seedStop(overrides: Record<string, unknown> = {}) {
    await db
      .insertInto('transport_stops')
      .values({
        id: 'HSL:1140447',
        name: 'Keilaniemi',
        code: 'E1234',
        latitude: 60.1756,
        longitude: 24.8275,
        vehicle_type: 'METRO',
        distance_m: 350,
        ...overrides,
      })
      .execute();
  }

  async function seedDeparture(stopId: string, overrides: Record<string, unknown> = {}) {
    await db
      .insertInto('transport_departures')
      .values({
        stop_id: stopId,
        route_short_name: 'M1',
        headsign: 'Matinkyla',
        scheduled_departure: 32400,
        service_day: '2026-04-15',
        vehicle_type: 'METRO',
        ...overrides,
      })
      .execute();
  }

  describe('GET /api/transport/stops', () => {
    it('returns empty list when no stops', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/transport/stops' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('returns stops ordered by distance', async () => {
      await seedStop({ id: 'HSL:1', name: 'Far', distance_m: 500 });
      await seedStop({ id: 'HSL:2', name: 'Near', distance_m: 100, vehicle_type: 'BUS' });

      const res = await app.inject({ method: 'GET', url: '/api/transport/stops' });
      const data = res.json().data;
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('Near');
      expect(data[1].name).toBe('Far');
    });

    it('filters by vehicleType', async () => {
      await seedStop({ id: 'HSL:1', name: 'Metro Stop', vehicle_type: 'METRO' });
      await seedStop({ id: 'HSL:2', name: 'Bus Stop', vehicle_type: 'BUS' });

      const res = await app.inject({ method: 'GET', url: '/api/transport/stops?vehicleType=BUS' });
      expect(res.json().data).toHaveLength(1);
      expect(res.json().data[0].name).toBe('Bus Stop');
    });
  });

  describe('GET /api/transport/stops/:id/departures', () => {
    it('returns departures for a stop', async () => {
      await seedStop();
      await seedDeparture('HSL:1140447');
      await seedDeparture('HSL:1140447', { route_short_name: 'M2', scheduled_departure: 33000 });

      const res = await app.inject({
        method: 'GET',
        url: '/api/transport/stops/HSL:1140447/departures',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(2);
      expect(res.json().data[0].routeShortName).toBe('M1');
    });

    it('returns 404 for nonexistent stop', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/transport/stops/nonexistent/departures',
      });
      expect(res.statusCode).toBe(404);
    });

    it('respects limit parameter', async () => {
      await seedStop();
      await seedDeparture('HSL:1140447', { scheduled_departure: 32400 });
      await seedDeparture('HSL:1140447', { scheduled_departure: 33000 });
      await seedDeparture('HSL:1140447', { scheduled_departure: 33600 });

      const res = await app.inject({
        method: 'GET',
        url: '/api/transport/stops/HSL:1140447/departures?limit=2',
      });
      expect(res.json().data).toHaveLength(2);
    });
  });

  describe('GET /api/transport/departures', () => {
    it('returns all departures across stops', async () => {
      await seedStop({ id: 'HSL:1', vehicle_type: 'METRO' });
      await seedStop({ id: 'HSL:2', vehicle_type: 'BUS' });
      await seedDeparture('HSL:1');
      await seedDeparture('HSL:2', { vehicle_type: 'BUS', route_short_name: '550' });

      const res = await app.inject({ method: 'GET', url: '/api/transport/departures' });
      expect(res.json().data).toHaveLength(2);
    });

    it('filters by vehicleType', async () => {
      await seedStop({ id: 'HSL:1', vehicle_type: 'METRO' });
      await seedStop({ id: 'HSL:2', vehicle_type: 'BUS' });
      await seedDeparture('HSL:1');
      await seedDeparture('HSL:2', { vehicle_type: 'BUS', route_short_name: '550' });

      const res = await app.inject({
        method: 'GET',
        url: '/api/transport/departures?vehicleType=BUS',
      });
      expect(res.json().data).toHaveLength(1);
      expect(res.json().data[0].routeShortName).toBe('550');
    });
  });
});
