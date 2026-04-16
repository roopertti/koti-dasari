import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

describe('Weather API', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  describe('GET /api/weather/current', () => {
    it('returns 404 when no weather data exists', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/weather/current' });
      expect(res.statusCode).toBe(404);
    });

    it('returns current weather when data exists', async () => {
      await db
        .insertInto('weather_current')
        .values({
          id: 1,
          temperature: 8.5,
          apparent_temp: 5.2,
          humidity: 72,
          wind_speed: 15.3,
          wind_direction: 220,
          precipitation: 0.0,
          weather_code: 2,
          cloud_cover: 45,
          pressure: 1013.2,
          latitude: 60.1699,
          longitude: 24.9384,
        })
        .execute();

      const res = await app.inject({ method: 'GET', url: '/api/weather/current' });
      expect(res.statusCode).toBe(200);
      const { data } = res.json();
      expect(data.temperature).toBe(8.5);
      expect(data.weatherCode).toBe(2);
      expect(data.id).toBeUndefined();
    });
  });

  describe('GET /api/weather/forecast', () => {
    it('returns empty list when no forecast data', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/weather/forecast' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('returns future forecasts only', async () => {
      const past = new Date(Date.now() - 3600000).toISOString();
      const future = new Date(Date.now() + 3600000).toISOString();

      await db
        .insertInto('weather_hourly')
        .values({
          forecast_time: past,
          temperature: 7.0,
          weather_code: 1,
        })
        .execute();
      await db
        .insertInto('weather_hourly')
        .values({
          forecast_time: future,
          temperature: 9.0,
          weather_code: 2,
        })
        .execute();

      const res = await app.inject({ method: 'GET', url: '/api/weather/forecast' });
      expect(res.json().data).toHaveLength(1);
      expect(res.json().data[0].temperature).toBe(9.0);
    });

    it('respects hours limit', async () => {
      for (let i = 1; i <= 5; i++) {
        const time = new Date(Date.now() + i * 3600000).toISOString();
        await db
          .insertInto('weather_hourly')
          .values({ forecast_time: time, temperature: 8 + i, weather_code: 1 })
          .execute();
      }

      const res = await app.inject({ method: 'GET', url: '/api/weather/forecast?hours=3' });
      expect(res.json().data).toHaveLength(3);
    });
  });
});
