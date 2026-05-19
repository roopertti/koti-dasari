import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export interface ApiKeyOptions {
  keys: string[];
}

const EXEMPT_PATHS = new Set(['/api/health']);

function isExempt(request: FastifyRequest): boolean {
  // Strip the query string so '/api/health?foo=bar' still matches '/api/health'.
  // onRequest fires before routing, so we can't rely on request.routeOptions.url.
  const path = request.url.split('?', 1)[0];
  // Admin uses session cookies, not API keys
  if (path.startsWith('/api/admin/') || path === '/api/admin') {
    return true;
  }
  return EXEMPT_PATHS.has(path);
}

function matchesAnyKey(provided: string, known: string[]): boolean {
  const providedBuf = Buffer.from(provided);
  let matched = false;
  for (const key of known) {
    const knownBuf = Buffer.from(key);
    if (knownBuf.length !== providedBuf.length) {
      continue;
    }
    if (timingSafeEqual(knownBuf, providedBuf)) {
      matched = true;
    }
  }
  return matched;
}

async function plugin(app: FastifyInstance, options: ApiKeyOptions) {
  const { keys } = options;

  if (keys.length === 0) {
    app.log.warn(
      '[auth] API_KEYS is empty — /api/* is unauthenticated. Set API_KEYS=<comma-separated> to enable per-client keys.',
    );
    return;
  }

  app.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/api/')) {
      return;
    }
    if (isExempt(request)) {
      return;
    }
    const provided = request.headers['x-api-key'];
    if (typeof provided !== 'string' || provided.length === 0) {
      return reply.status(401).send({
        error: { message: 'Missing x-api-key header', code: 'UNAUTHORIZED' },
      });
    }
    if (!matchesAnyKey(provided, keys)) {
      return reply.status(401).send({
        error: { message: 'Invalid API key', code: 'UNAUTHORIZED' },
      });
    }
  });
}

export const apiKeyPlugin = fp(plugin, { name: 'api-key' });
