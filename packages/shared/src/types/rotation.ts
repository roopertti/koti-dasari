/**
 * Idle-gated page rotation on the kiosk (Phase 18). The dashboard advances to
 * the next page every `intervalMs`, but only once the screen has been left
 * alone for `idleMs` — so a viewer mid-read is never yanked to another page.
 * Any touch resets the idle countdown.
 */
export interface RotationSettings {
  enabled: boolean;
  intervalMs: number;
  idleMs: number;
}

/**
 * Accepted ranges for the two timings, shared by the API's request schema and
 * the admin form inputs so both agree on what is valid.
 */
export const ROTATION_LIMITS = {
  intervalMs: { min: 5_000, max: 600_000 },
  idleMs: { min: 30_000, max: 3_600_000 },
} as const;

/**
 * Index of the page to rotate to, wrapping back to the first. Out-of-range
 * `current` values (a half-finished swipe, a resize mid-scroll) are clamped
 * rather than propagated.
 */
export function nextPageIndex(current: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  const clamped = Math.min(Math.max(current, 0), count - 1);
  return (clamped + 1) % count;
}
