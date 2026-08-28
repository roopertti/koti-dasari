import { useQuery } from '@tanstack/react-query';
import { getDisplaySettings } from '../api/settings.js';

export const DISPLAY_SETTINGS_KEY = ['settings', 'display'] as const;

const REFRESH_MS = 30_000;

/**
 * Polls the public display config (sleep window + override). Kept short enough
 * that an admin override reflects on the kiosk within ~30s.
 */
export function useDisplaySettings() {
  return useQuery({
    queryKey: DISPLAY_SETTINGS_KEY,
    queryFn: ({ signal }) => getDisplaySettings(signal),
    refetchInterval: REFRESH_MS,
  });
}
