import type { NewsItemTable } from '@home-dashboard/db';
import type { FastifyInstance } from 'fastify';
import type { Selectable } from 'kysely';
import '../types.js';
import { mapRow } from '../mapping.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function mapNewsRow(row: Selectable<NewsItemTable>) {
  return mapRow(row);
}

export async function newsRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { limit?: number };
  }>(
    '/news',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT },
          },
        },
      },
    },
    async (request) => {
      const limit = request.query.limit ?? DEFAULT_LIMIT;
      const rows = await app.db
        .selectFrom('news_items')
        .selectAll()
        .orderBy('published_at', 'desc')
        .limit(limit)
        .execute();
      return { data: rows.map(mapNewsRow) };
    },
  );
}
