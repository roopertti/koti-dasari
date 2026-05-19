import { timingSafeEqual } from 'node:crypto';
import fastifyCookie from '@fastify/cookie';
import fastifySecureSession from '@fastify/secure-session';
import { type DashboardSettings, readSettings, writeSettings } from '@home-dashboard/db';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const SESSION_FIELD = 'authed';

declare module '@fastify/secure-session' {
  interface SessionData {
    authed: boolean;
    since: string;
  }
}

export interface AdminPluginOptions {
  pin: string | null;
  sessionKey: Buffer | null;
}

function pinMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

async function plugin(app: FastifyInstance, options: AdminPluginOptions) {
  const { pin, sessionKey } = options;

  if (!pin || !sessionKey) {
    app.log.warn(
      '[auth] Admin disabled — set ADMIN_PIN and ADMIN_SESSION_KEY to enable. /api/admin/* will return 503.',
    );
    app.all('/api/admin/*', async (_request, reply) => {
      return reply
        .status(503)
        .send({ error: { message: 'Admin is not configured', code: 'ADMIN_DISABLED' } });
    });
    return;
  }

  await app.register(fastifyCookie);
  await app.register(fastifySecureSession, {
    key: sessionKey,
    cookieName: 'home-dashboard-admin',
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      // secure: false — kiosk runs on http://<pi>; toggling secure would block login over LAN
      maxAge: 60 * 60 * 24 * 14, // 14 days
    },
  });

  async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    if (request.session.get(SESSION_FIELD) !== true) {
      return reply.status(401).send({ error: { message: 'Login required', code: 'UNAUTHORIZED' } });
    }
  }

  app.post<{ Body: { pin: string } }>(
    '/api/admin/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['pin'],
          properties: {
            pin: { type: 'string', minLength: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      if (!pinMatches(request.body.pin, pin)) {
        return reply.status(401).send({ error: { message: 'Invalid PIN', code: 'UNAUTHORIZED' } });
      }
      request.session.set(SESSION_FIELD, true);
      request.session.set('since', new Date().toISOString());
      return { data: { authed: true } };
    },
  );

  app.post('/api/admin/logout', async (request) => {
    request.session.delete();
    return { data: { authed: false } };
  });

  app.get('/api/admin/session', async (request) => {
    const authed = request.session.get(SESSION_FIELD) === true;
    const since = request.session.get('since') ?? null;
    return { data: { authed, since } };
  });

  app.get('/api/admin/settings', { preHandler: requireAdmin }, async () => {
    const stored = await readSettings(app.db);
    return { data: stored };
  });

  app.put<{ Body: Partial<DashboardSettings> }>(
    '/api/admin/settings',
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: 'object',
          properties: {
            homeLatitude: { type: 'number', minimum: -90, maximum: 90 },
            homeLongitude: { type: 'number', minimum: -180, maximum: 180 },
            transportRadius: { type: 'integer', minimum: 50, maximum: 10000 },
            transportIntervalMs: { type: 'integer', minimum: 30_000, maximum: 3_600_000 },
            weatherIntervalMs: { type: 'integer', minimum: 60_000, maximum: 6 * 3_600_000 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      await writeSettings(app.db, request.body);
      const stored = await readSettings(app.db);
      return { data: stored };
    },
  );
}

export const adminSessionPlugin = fp(plugin, { name: 'admin-session' });
