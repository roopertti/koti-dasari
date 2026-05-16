import cors from '@fastify/cors';
import type { Database } from '@home-dashboard/db';
import Fastify, { type FastifyError } from 'fastify';
import type { Kysely } from 'kysely';
import { calendarRoutes } from './routes/calendar.js';
import { healthRoutes } from './routes/health.js';
import { todosRoutes } from './routes/todos.js';
import { transportRoutes } from './routes/transport.js';
import { weatherRoutes } from './routes/weather.js';

export interface AppOptions {
  db: Kysely<Database>;
}

export async function buildApp(options: AppOptions) {
  const app = Fastify({
    logger: true,
    schemaErrorFormatter(errors) {
      const first = errors[0];
      const field =
        first.instancePath?.replace('/', '') || first.params?.missingProperty || 'input';
      return new Error(`${field}: ${first.message}`);
    },
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error.validation) {
      return reply
        .status(400)
        .send({ error: { message: error.message, code: 'VALIDATION_ERROR' } });
    }
    reply
      .status(error.statusCode ?? 500)
      .send({ error: { message: error.message, code: 'INTERNAL_ERROR' } });
  });

  await app.register(cors, { origin: true });

  app.decorate('db', options.db);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(calendarRoutes, { prefix: '/api' });
  await app.register(todosRoutes, { prefix: '/api' });
  await app.register(transportRoutes, { prefix: '/api' });
  await app.register(weatherRoutes, { prefix: '/api' });

  return app;
}
