import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function authPlugin(fastify: FastifyInstance, opts: { apiKey?: string }) {
  if (!opts.apiKey) {
    return;
  }

  const key = opts.apiKey;

  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url === '/api/health') {
      return;
    }

    const provided = request.headers['x-api-key'];
    if (provided !== key) {
      return reply.status(401).send({
        error: { message: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
      });
    }
  });
}

export default fp(authPlugin, { name: 'auth' });
