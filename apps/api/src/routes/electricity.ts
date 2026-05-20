import type { ElectricityPriceTable } from '@home-dashboard/db';
import type { FastifyInstance } from 'fastify';
import type { Selectable } from 'kysely';
import '../types.js';
import { mapRow } from '../mapping.js';

function mapElectricityPriceRow(row: Selectable<ElectricityPriceTable>) {
  return mapRow(row);
}

export async function electricityRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { from?: string; to?: string };
  }>('/electricity/prices', async (request) => {
    const { from, to } = request.query;
    let query = app.db.selectFrom('electricity_prices').selectAll();

    if (from) {
      query = query.where('hour_start', '>=', from);
    }
    if (to) {
      query = query.where('hour_start', '<=', to);
    }

    query = query.orderBy('hour_start', 'asc');
    const rows = await query.execute();
    return { data: rows.map(mapElectricityPriceRow) };
  });
}
