import { t } from './t.js';

// The API error codes that have a localized `error.api.<code>` string. Codes
// outside this set fall back to the raw server message (see apiErrorMessage).
const KNOWN_CODES = new Set([
  'ADMIN_DISABLED',
  'NOT_FOUND',
  'READ_ONLY_SOURCE',
  'UNAUTHORIZED',
  'VALIDATION_ERROR',
  'INTERNAL_ERROR',
]);

/**
 * Resolve an API error `{ message, code }` to a user-facing string. Known codes
 * map to a localized `error.api.<code>` catalog entry; anything else falls back
 * to the server-provided message.
 */
export function apiErrorMessage(code: string, fallback: string): string {
  return KNOWN_CODES.has(code) ? t(`error.api.${code}`) : fallback;
}
