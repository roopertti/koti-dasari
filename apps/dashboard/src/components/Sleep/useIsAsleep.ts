import { useContext } from 'react';
import { SleepContext } from './sleepContext.js';

/**
 * True while the kiosk is dimmed for the night.
 *
 * Anything that renders into the browser's *top layer* — i.e. a `<dialog>`
 * opened with `showModal()` — paints above the sleep overlay no matter its
 * z-index, so it would stay lit all night. Such components must read this and
 * tear themselves down instead of relying on the overlay to cover them.
 */
export function useIsAsleep(): boolean {
  return useContext(SleepContext);
}
