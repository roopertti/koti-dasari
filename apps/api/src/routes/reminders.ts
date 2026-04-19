import type { FastifyInstance } from 'fastify';
import '../types.js';
import { mapReminderRow } from '../mapping.js';

export async function remindersRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { acknowledged?: string; from?: string; to?: string; limit?: string };
  }>('/reminders', async (request) => {
    const { acknowledged, from, to, limit } = request.query;
    let query = app.db.selectFrom('reminders').selectAll();

    if (acknowledged !== undefined) {
      query = query.where('acknowledged', '=', acknowledged === 'true' ? 1 : 0);
    }
    if (from) {
      query = query.where('remind_at', '>=', from);
    }
    if (to) {
      query = query.where('remind_at', '<=', to);
    }

    query = query.orderBy('remind_at', 'asc').limit(Number(limit) || 50);
    const rows = await query.execute();
    return { data: rows.map(mapReminderRow) };
  });

  app.get<{ Params: { id: string } }>('/reminders/:id', async (request, reply) => {
    const row = await app.db
      .selectFrom('reminders')
      .selectAll()
      .where('id', '=', request.params.id)
      .executeTakeFirst();

    if (!row) {
      return reply
        .status(404)
        .send({ error: { message: 'Reminder not found', code: 'NOT_FOUND' } });
    }
    return { data: mapReminderRow(row) };
  });

  app.post<{
    Body: {
      title: string;
      description?: string | null;
      remindAt: string;
      recurring?: string | null;
    };
  }>(
    '/reminders',
    {
      schema: {
        body: {
          type: 'object',
          required: ['title', 'remindAt'],
          properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: ['string', 'null'] },
            remindAt: { type: 'string' },
            recurring: { type: ['string', 'null'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { title, description, remindAt, recurring } = request.body;

      const row = await app.db
        .insertInto('reminders')
        .values({
          title: title.trim(),
          description: description ?? null,
          remind_at: remindAt,
          recurring: recurring ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return reply.status(201).send({ data: mapReminderRow(row) });
    },
  );

  app.put<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string | null;
      remindAt?: string;
      recurring?: string | null;
    };
  }>(
    '/reminders/:id',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: ['string', 'null'] },
            remindAt: { type: 'string' },
            recurring: { type: ['string', 'null'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const existing = await app.db
        .selectFrom('reminders')
        .selectAll()
        .where('id', '=', request.params.id)
        .executeTakeFirst();

      if (!existing) {
        return reply
          .status(404)
          .send({ error: { message: 'Reminder not found', code: 'NOT_FOUND' } });
      }

      const { title, description, remindAt, recurring } = request.body;
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (title !== undefined) {
        updates.title = title.trim();
      }
      if (description !== undefined) {
        updates.description = description;
      }
      if (remindAt !== undefined) {
        updates.remind_at = remindAt;
      }
      if (recurring !== undefined) {
        updates.recurring = recurring;
      }

      const row = await app.db
        .updateTable('reminders')
        .set(updates)
        .where('id', '=', request.params.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      return { data: mapReminderRow(row) };
    },
  );

  app.patch<{ Params: { id: string } }>('/reminders/:id/acknowledge', async (request, reply) => {
    const existing = await app.db
      .selectFrom('reminders')
      .select('id')
      .where('id', '=', request.params.id)
      .executeTakeFirst();

    if (!existing) {
      return reply
        .status(404)
        .send({ error: { message: 'Reminder not found', code: 'NOT_FOUND' } });
    }

    const row = await app.db
      .updateTable('reminders')
      .set({ acknowledged: 1, updated_at: new Date().toISOString() })
      .where('id', '=', request.params.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return { data: mapReminderRow(row) };
  });

  app.delete<{ Params: { id: string } }>('/reminders/:id', async (request, reply) => {
    const result = await app.db
      .deleteFrom('reminders')
      .where('id', '=', request.params.id)
      .executeTakeFirst();

    if (result.numDeletedRows === 0n) {
      return reply
        .status(404)
        .send({ error: { message: 'Reminder not found', code: 'NOT_FOUND' } });
    }
    return reply.status(204).send();
  });
}
