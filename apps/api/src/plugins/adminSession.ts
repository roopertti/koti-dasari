import { timingSafeEqual } from 'node:crypto';
import fastifyCookie from '@fastify/cookie';
import fastifySecureSession from '@fastify/secure-session';
import {
  type DashboardSettings,
  readSettings,
  resolveSettings,
  rotationFromSettings,
  type SleepOverrideMode,
  sleepFromSettings,
  writeSettings,
} from '@home-dashboard/db';
import { nextBoundaryInstant } from '@home-dashboard/i18n';
import { parseHm, ROTATION_LIMITS } from '@home-dashboard/shared';
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
      '[auth] Admin disabled — set ADMIN_PIN and ADMIN_SESSION_KEY to enable. /api/admin/* will return 503 and admin-gated mutations on /api/* will also return 503.',
    );
    app.decorate('requireAdmin', async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply
        .status(503)
        .send({ error: { message: 'Admin is not configured', code: 'ADMIN_DISABLED' } });
    });
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

  app.decorate('requireAdmin', requireAdmin);

  app.post<{ Body: { pin: string } }>(
    '/api/admin/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
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
        request.log.warn({ ip: request.ip }, 'admin login failed');
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

  const HHMM_PATTERN = '^([01][0-9]|2[0-3]):[0-5][0-9]$';

  app.put<{ Body: { enabled?: boolean; start?: string; end?: string } }>(
    '/api/admin/sleep',
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            start: { type: 'string', pattern: HHMM_PATTERN },
            end: { type: 'string', pattern: HHMM_PATTERN },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const patch: Partial<DashboardSettings> = {};
      if (request.body.enabled !== undefined) {
        patch.sleepEnabled = request.body.enabled;
      }
      if (request.body.start !== undefined) {
        patch.sleepStart = request.body.start;
      }
      if (request.body.end !== undefined) {
        patch.sleepEnd = request.body.end;
      }
      await writeSettings(app.db, patch);
      return { data: sleepFromSettings(await resolveSettings(app.db)) };
    },
  );

  app.post<{ Body: { mode: SleepOverrideMode } }>(
    '/api/admin/sleep/override',
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: 'object',
          required: ['mode'],
          properties: {
            mode: { type: 'string', enum: ['auto', 'wake', 'sleep'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const { mode } = request.body;
      if (mode === 'auto') {
        await writeSettings(app.db, { sleepOverride: 'auto', sleepOverrideUntil: null });
      } else {
        // Override holds until the next schedule boundary (start or end),
        // then the schedule resumes on its own.
        const current = await resolveSettings(app.db);
        const start = parseHm(current.sleepStart);
        const end = parseHm(current.sleepEnd);
        if (start === null || end === null) {
          throw new Error('Invalid sleep schedule; cannot compute override expiry');
        }
        const until = nextBoundaryInstant(new Date(), start, end).toISOString();
        await writeSettings(app.db, { sleepOverride: mode, sleepOverrideUntil: until });
      }
      return { data: sleepFromSettings(await resolveSettings(app.db)) };
    },
  );

  app.put<{ Body: { enabled?: boolean; intervalMs?: number; idleMs?: number } }>(
    '/api/admin/rotation',
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            intervalMs: {
              type: 'integer',
              minimum: ROTATION_LIMITS.intervalMs.min,
              maximum: ROTATION_LIMITS.intervalMs.max,
            },
            idleMs: {
              type: 'integer',
              minimum: ROTATION_LIMITS.idleMs.min,
              maximum: ROTATION_LIMITS.idleMs.max,
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const patch: Partial<DashboardSettings> = {};
      if (request.body.enabled !== undefined) {
        patch.rotateEnabled = request.body.enabled;
      }
      if (request.body.intervalMs !== undefined) {
        patch.rotateIntervalMs = request.body.intervalMs;
      }
      if (request.body.idleMs !== undefined) {
        patch.rotateIdleMs = request.body.idleMs;
      }
      await writeSettings(app.db, patch);
      return { data: rotationFromSettings(await resolveSettings(app.db)) };
    },
  );
}

export const adminSessionPlugin = fp(plugin, { name: 'admin-session' });
