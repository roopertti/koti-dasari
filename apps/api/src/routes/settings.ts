import { resolveSettings, sleepFromSettings } from '@home-dashboard/db';
import type { FastifyInstance } from 'fastify';
import '../types.js';

/**
 * Public (API-key gated) display configuration the kiosk needs to render — the
 * sleep window and current override. Deliberately exposes only display config,
 * never PINs/keys, so it can sit outside the admin cookie gate. Nested under
 * `sleep` to leave room for future display settings (rotation, etc).
 */
export async function settingsRoutes(app: FastifyInstance) {
  app.get('/settings/display', async () => {
    const resolved = await resolveSettings(app.db);
    return { data: { sleep: sleepFromSettings(resolved) } };
  });
}
