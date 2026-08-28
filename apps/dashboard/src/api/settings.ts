import type { SleepSettings } from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export interface DisplaySettings {
  sleep: SleepSettings;
}

/** Public (API-key gated) display config the kiosk needs to render the overlay. */
export function getDisplaySettings(signal?: AbortSignal): Promise<DisplaySettings> {
  return apiRequest<DisplaySettings>('/settings/display', { signal });
}
