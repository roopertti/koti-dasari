import type { FastifyInstance } from 'fastify';
import '../types.js';
import { mapDepartureRow, mapStopRow } from '../mapping.js';

export async function transportRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { vehicleType?: string };
  }>('/transport/stops', async (request) => {
    const { vehicleType } = request.query;
    let query = app.db.selectFrom('transport_stops').selectAll();

    if (vehicleType) {
      query = query.where(
        'vehicle_type',
        '=',
        vehicleType as 'BUS' | 'TRAM' | 'METRO' | 'TRAIN' | 'FERRY',
      );
    }

    query = query.orderBy('distance_m', 'asc');
    const rows = await query.execute();
    return { data: rows.map(mapStopRow) };
  });

  app.get<{
    Params: { id: string };
    Querystring: { limit?: string };
  }>('/transport/stops/:id/departures', async (request, reply) => {
    const stop = await app.db
      .selectFrom('transport_stops')
      .select('id')
      .where('id', '=', request.params.id)
      .executeTakeFirst();

    if (!stop) {
      return reply
        .status(404)
        .send({ error: { message: 'Transport stop not found', code: 'NOT_FOUND' } });
    }

    const rows = await app.db
      .selectFrom('transport_departures')
      .selectAll()
      .where('stop_id', '=', request.params.id)
      .orderBy('service_day', 'asc')
      .orderBy('scheduled_departure', 'asc')
      .limit(Number(request.query.limit) || 10)
      .execute();

    return { data: rows.map(mapDepartureRow) };
  });

  app.get<{
    Querystring: { vehicleType?: string; limit?: string };
  }>('/transport/departures', async (request) => {
    const { vehicleType, limit } = request.query;
    let query = app.db.selectFrom('transport_departures').selectAll();

    if (vehicleType) {
      query = query.where(
        'vehicle_type',
        '=',
        vehicleType as 'BUS' | 'TRAM' | 'METRO' | 'TRAIN' | 'FERRY',
      );
    }

    query = query
      .orderBy('service_day', 'asc')
      .orderBy('scheduled_departure', 'asc')
      .limit(Number(limit) || 20);

    const rows = await query.execute();
    return { data: rows.map(mapDepartureRow) };
  });
}
