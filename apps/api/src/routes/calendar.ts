import type { FastifyInstance } from 'fastify';
import '../types.js';
import { mapEventRow } from '../mapping.js';

export async function calendarRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { from?: string; to?: string; limit?: string };
  }>('/calendar/events', async (request) => {
    const { from, to, limit } = request.query;
    let query = app.db.selectFrom('calendar_events').selectAll();

    if (from) {
      query = query.where('start_time', '>=', from);
    }
    if (to) {
      query = query.where('end_time', '<=', to);
    }

    query = query.orderBy('start_time', 'asc').limit(Number(limit) || 50);
    const rows = await query.execute();
    return { data: rows.map(mapEventRow) };
  });

  app.get<{ Params: { id: string } }>('/calendar/events/:id', async (request, reply) => {
    const row = await app.db
      .selectFrom('calendar_events')
      .selectAll()
      .where('id', '=', request.params.id)
      .executeTakeFirst();

    if (!row) {
      return reply
        .status(404)
        .send({ error: { message: 'Calendar event not found', code: 'NOT_FOUND' } });
    }
    return { data: mapEventRow(row) };
  });

  app.post<{
    Body: {
      title: string;
      description?: string | null;
      location?: string | null;
      startTime: string;
      endTime: string;
      allDay?: boolean;
      color?: string | null;
    };
  }>(
    '/calendar/events',
    {
      schema: {
        body: {
          type: 'object',
          required: ['title', 'startTime', 'endTime'],
          properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: ['string', 'null'] },
            location: { type: ['string', 'null'] },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            allDay: { type: 'boolean' },
            color: { type: ['string', 'null'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { title, description, location, startTime, endTime, allDay, color } = request.body;

      if (new Date(endTime) <= new Date(startTime)) {
        return reply.status(400).send({
          error: { message: 'endTime must be after startTime', code: 'VALIDATION_ERROR' },
        });
      }

      const row = await app.db
        .insertInto('calendar_events')
        .values({
          title: title.trim(),
          description: description ?? null,
          location: location ?? null,
          start_time: startTime,
          end_time: endTime,
          all_day: allDay ? 1 : 0,
          color: color ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return reply.status(201).send({ data: mapEventRow(row) });
    },
  );

  app.put<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string | null;
      location?: string | null;
      startTime?: string;
      endTime?: string;
      allDay?: boolean;
      color?: string | null;
    };
  }>(
    '/calendar/events/:id',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: ['string', 'null'] },
            location: { type: ['string', 'null'] },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            allDay: { type: 'boolean' },
            color: { type: ['string', 'null'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { title, description, location, startTime, endTime, allDay, color } = request.body;

      const existing = await app.db
        .selectFrom('calendar_events')
        .selectAll()
        .where('id', '=', request.params.id)
        .executeTakeFirst();

      if (!existing) {
        return reply
          .status(404)
          .send({ error: { message: 'Calendar event not found', code: 'NOT_FOUND' } });
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title.trim();
      if (description !== undefined) updates.description = description;
      if (location !== undefined) updates.location = location;
      if (startTime !== undefined) updates.start_time = startTime;
      if (endTime !== undefined) updates.end_time = endTime;
      if (allDay !== undefined) updates.all_day = allDay ? 1 : 0;
      if (color !== undefined) updates.color = color;

      const row = await app.db
        .updateTable('calendar_events')
        .set(updates)
        .where('id', '=', request.params.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      return { data: mapEventRow(row) };
    },
  );

  app.delete<{ Params: { id: string } }>('/calendar/events/:id', async (request, reply) => {
    const result = await app.db
      .deleteFrom('calendar_events')
      .where('id', '=', request.params.id)
      .executeTakeFirst();

    if (result.numDeletedRows === 0n) {
      return reply
        .status(404)
        .send({ error: { message: 'Calendar event not found', code: 'NOT_FOUND' } });
    }
    return reply.status(204).send();
  });
}
