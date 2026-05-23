import type { Database } from '@home-dashboard/db';
import type { preHandlerHookHandler } from 'fastify';
import type { Kysely } from 'kysely';

declare module 'fastify' {
  interface FastifyInstance {
    db: Kysely<Database>;
    requireAdmin: preHandlerHookHandler;
  }
}
