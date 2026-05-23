import type { FastifyInstance } from 'fastify';
import '../types.js';
import { mapTodoRow } from '../mapping.js';

const WRITE_RATE_LIMIT = { max: 60, timeWindow: '1 minute' } as const;

export async function todosRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { completed?: string; priority?: string; limit?: string };
  }>('/todos', async (request) => {
    const { completed, priority, limit } = request.query;
    let query = app.db.selectFrom('todos').selectAll();

    if (completed !== undefined) {
      query = query.where('completed', '=', completed === 'true' ? 1 : 0);
    }
    if (priority) {
      query = query.where('priority', '=', priority as 'low' | 'medium' | 'high');
    }

    query = query
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .limit(Number(limit) || 50);
    const rows = await query.execute();
    return { data: rows.map(mapTodoRow) };
  });

  app.post<{
    Body: {
      title: string;
      description?: string | null;
      priority?: 'low' | 'medium' | 'high';
      dueDate?: string | null;
    };
  }>(
    '/todos',
    {
      preHandler: app.requireAdmin,
      config: { rateLimit: WRITE_RATE_LIMIT },
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: ['string', 'null'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            dueDate: { type: ['string', 'null'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { title, description, priority, dueDate } = request.body;

      const row = await app.db
        .insertInto('todos')
        .values({
          title: title.trim(),
          description: description ?? null,
          priority: priority ?? 'medium',
          due_date: dueDate ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return reply.status(201).send({ data: mapTodoRow(row) });
    },
  );

  app.put<{
    Body: { items: Array<{ id: string; sortOrder: number }> };
  }>(
    '/todos/reorder',
    {
      preHandler: app.requireAdmin,
      config: { rateLimit: WRITE_RATE_LIMIT },
      schema: {
        body: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'sortOrder'],
                properties: {
                  id: { type: 'string' },
                  sortOrder: { type: 'integer' },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const { items } = request.body;

      await app.db.transaction().execute(async (trx) => {
        for (const item of items) {
          await trx
            .updateTable('todos')
            .set({ sort_order: item.sortOrder, updated_at: new Date().toISOString() })
            .where('id', '=', item.id)
            .execute();
        }
      });

      return { data: { updated: items.length } };
    },
  );

  app.get<{ Params: { id: string } }>('/todos/:id', async (request, reply) => {
    const row = await app.db
      .selectFrom('todos')
      .selectAll()
      .where('id', '=', request.params.id)
      .executeTakeFirst();

    if (!row) {
      return reply.status(404).send({ error: { message: 'Todo not found', code: 'NOT_FOUND' } });
    }
    return { data: mapTodoRow(row) };
  });

  app.put<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string | null;
      priority?: 'low' | 'medium' | 'high';
      dueDate?: string | null;
      sortOrder?: number;
    };
  }>(
    '/todos/:id',
    {
      preHandler: app.requireAdmin,
      config: { rateLimit: WRITE_RATE_LIMIT },
      schema: {
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: ['string', 'null'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            dueDate: { type: ['string', 'null'] },
            sortOrder: { type: 'integer' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const existing = await app.db
        .selectFrom('todos')
        .selectAll()
        .where('id', '=', request.params.id)
        .executeTakeFirst();

      if (!existing) {
        return reply.status(404).send({ error: { message: 'Todo not found', code: 'NOT_FOUND' } });
      }

      const { title, description, priority, dueDate, sortOrder } = request.body;
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (title !== undefined) {
        updates.title = title.trim();
      }
      if (description !== undefined) {
        updates.description = description;
      }
      if (priority !== undefined) {
        updates.priority = priority;
      }
      if (dueDate !== undefined) {
        updates.due_date = dueDate;
      }
      if (sortOrder !== undefined) {
        updates.sort_order = sortOrder;
      }

      const row = await app.db
        .updateTable('todos')
        .set(updates)
        .where('id', '=', request.params.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      return { data: mapTodoRow(row) };
    },
  );

  app.patch<{ Params: { id: string } }>('/todos/:id/toggle', async (request, reply) => {
    const existing = await app.db
      .selectFrom('todos')
      .select(['id', 'completed'])
      .where('id', '=', request.params.id)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({ error: { message: 'Todo not found', code: 'NOT_FOUND' } });
    }

    const row = await app.db
      .updateTable('todos')
      .set({
        completed: existing.completed === 1 ? 0 : 1,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', request.params.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return { data: mapTodoRow(row) };
  });

  app.delete<{ Params: { id: string } }>(
    '/todos/:id',
    {
      preHandler: app.requireAdmin,
      config: { rateLimit: WRITE_RATE_LIMIT },
    },
    async (request, reply) => {
      const result = await app.db
        .deleteFrom('todos')
        .where('id', '=', request.params.id)
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) {
        return reply.status(404).send({ error: { message: 'Todo not found', code: 'NOT_FOUND' } });
      }
      return reply.status(204).send();
    },
  );
}
