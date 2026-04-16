import type { FastifyInstance } from 'fastify';
import '../types.js';
import { mapWeatherCurrentRow, mapWeatherHourlyRow } from '../mapping.js';

export async function weatherRoutes(app: FastifyInstance) {
  app.get('/weather/current', async (_request, reply) => {
    const row = await app.db
      .selectFrom('weather_current')
      .selectAll()
      .where('id', '=', 1)
      .executeTakeFirst();

    if (!row) {
      return reply
        .status(404)
        .send({ error: { message: 'No weather data available', code: 'NOT_FOUND' } });
    }

    return { data: mapWeatherCurrentRow(row) };
  });

  app.get<{
    Querystring: { hours?: string };
  }>('/weather/forecast', async (request) => {
    const hours = Math.min(Number(request.query.hours) || 24, 48);
    const now = new Date().toISOString();

    const rows = await app.db
      .selectFrom('weather_hourly')
      .selectAll()
      .where('forecast_time', '>=', now)
      .orderBy('forecast_time', 'asc')
      .limit(hours)
      .execute();

    return { data: rows.map(mapWeatherHourlyRow) };
  });
}
