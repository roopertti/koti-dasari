import rateLimit from '@fastify/rate-limit';
import type { Database } from '@home-dashboard/db';
import Fastify, { type FastifyError } from 'fastify';
import type { Kysely } from 'kysely';
import type { AuthConfig } from './config.js';
import { adminSessionPlugin } from './plugins/adminSession.js';
import { apiKeyPlugin } from './plugins/apiKey.js';
import { calendarRoutes } from './routes/calendar.js';
import { electricityRoutes } from './routes/electricity.js';
import { healthRoutes } from './routes/health.js';
import { newsRoutes } from './routes/news.js';
import { todosRoutes } from './routes/todos.js';
import { transportRoutes } from './routes/transport.js';
import { weatherRoutes } from './routes/weather.js';

export interface AppOptions {
  db: Kysely<Database>;
  auth?: AuthConfig;
}

const DEFAULT_AUTH: AuthConfig = {
  apiKeys: [],
  adminPin: null,
  adminSessionKey: null,
};

export async function buildApp(options: AppOptions) {
  const auth = options.auth ?? DEFAULT_AUTH;
  const app = Fastify({
    logger: true,
    // nginx is the only ingress and overwrites X-Forwarded-For with the real
    // client address, so request.ip reflects the LAN client (not the nginx
    // container) for per-client rate-limit keying and login-failure logging.
    trustProxy: true,
    schemaErrorFormatter(errors) {
      const first = errors[0];
      const field =
        first.instancePath?.replace('/', '') || first.params?.missingProperty || 'input';
      return new Error(`${field}: ${first.message}`);
    },
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      return reply
        .status(400)
        .send({ error: { message: error.message, code: 'VALIDATION_ERROR' } });
    }
    const status = error.statusCode ?? 500;
    if (status >= 500) {
      request.log.error({ err: error }, 'request failed');
      return reply
        .status(status)
        .send({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } });
    }
    reply.status(status).send({ error: { message: error.message, code: 'INTERNAL_ERROR' } });
  });

  app.decorate('db', options.db);

  await app.register(rateLimit, {
    global: false,
    max: 120,
    timeWindow: '1 minute',
  });

  // Order matters: adminSessionPlugin installs app.requireAdmin, which the
  // calendar/todos route plugins reference at registration time via
  // `preHandler: app.requireAdmin`. Registering the routes before
  // adminSessionPlugin would throw at boot ("preHandler is undefined"), not
  // silently bypass the gate — but the dependency is implicit, so keep it
  // deliberate.
  await app.register(apiKeyPlugin, { keys: auth.apiKeys });
  await app.register(adminSessionPlugin, {
    pin: auth.adminPin,
    sessionKey: auth.adminSessionKey,
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(calendarRoutes, { prefix: '/api' });
  await app.register(todosRoutes, { prefix: '/api' });
  await app.register(transportRoutes, { prefix: '/api' });
  await app.register(weatherRoutes, { prefix: '/api' });
  await app.register(electricityRoutes, { prefix: '/api' });
  await app.register(newsRoutes, { prefix: '/api' });

  return app;
}
