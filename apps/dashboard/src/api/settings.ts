import type { RotationSettings, SleepSettings } from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export interface DisplaySettings {
  sleep: SleepSettings;
  rotation: RotationSettings;
}

/** Public (API-key gated) display config the kiosk needs: sleep + page rotation. */
export function getDisplaySettings(signal?: AbortSignal): Promise<DisplaySettings> {
  return apiRequest<DisplaySettings>('/settings/display', { signal });
}
