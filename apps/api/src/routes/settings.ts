import { resolveSettings, rotationFromSettings, sleepFromSettings } from '@home-dashboard/db';
import type { FastifyInstance } from 'fastify';
import '../types.js';

/**
 * Public (API-key gated) display configuration the kiosk needs to render — the
 * sleep window and current override, plus the idle page-rotation config.
 * Deliberately exposes only display config, never PINs/keys, so it can sit
 * outside the admin cookie gate. Grouped per feature to leave room for more.
 */
export async function settingsRoutes(app: FastifyInstance) {
  app.get('/settings/display', async () => {
    const resolved = await resolveSettings(app.db);
    return {
      data: { sleep: sleepFromSettings(resolved), rotation: rotationFromSettings(resolved) },
    };
  });
}
