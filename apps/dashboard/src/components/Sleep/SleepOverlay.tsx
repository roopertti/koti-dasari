import { helsinkiMinutesOfDay, timeHm } from '@home-dashboard/i18n';
import { isAsleep } from '@home-dashboard/shared';
import { type ReactNode, useState } from 'react';
import { useClock } from '../../hooks/useClock.js';
import { useDisplaySettings } from '../../hooks/useDisplaySettings.js';
import * as styles from './SleepOverlay.css.js';
import { SleepContext } from './sleepContext.js';

// How long a tap keeps the dashboard awake before it fades back to sleep.
const WAKE_MS = 30_000;

interface SleepOverlayProps {
  children: ReactNode;
}

/**
 * Wraps the kiosk. During the sleep window it fades a near-black clock screen
 * over the dashboard; tapping wakes it for a short idle window, then it fades
 * back. The display stays powered the whole time (software dim — see Phase 15).
 * Manual admin overrides are already baked into `isAsleep` via the polled
 * config, so they're handled the same as the schedule.
 *
 * The overlay is published on `SleepContext` because it cannot cover everything
 * on its own: a `<dialog>` opened with `showModal()` lives in the browser's top
 * layer and paints above any z-index. Those components read `useIsAsleep()` and
 * close themselves — see `NewsPanel` and `AdminQRButton`.
 */
export function SleepOverlay({ children }: SleepOverlayProps) {
  const { data } = useDisplaySettings();
  const now = useClock();
  const [wakeUntil, setWakeUntil] = useState<number | null>(null);

  const sleep = data?.sleep;
  // Fail open: if the config hasn't loaded, never sleep.
  const scheduledAsleep = sleep ? isAsleep(now, helsinkiMinutesOfDay(now), sleep) : false;
  const locallyAwake = wakeUntil !== null && now.getTime() < wakeUntil;
  const asleep = scheduledAsleep && !locallyAwake;

  // A tap anywhere wakes (when asleep) or extends the idle window (when already
  // awake within the sleep period). Outside the sleep window it's a no-op.
  function handlePointerDown() {
    if (scheduledAsleep) {
      setWakeUntil(Date.now() + WAKE_MS);
    }
  }

  return (
    <div className={styles.root} onPointerDown={handlePointerDown}>
      <SleepContext.Provider value={asleep}>{children}</SleepContext.Provider>
      <div
        className={asleep ? styles.overlayVisible : styles.overlayHidden}
        aria-hidden={!asleep}
        data-testid="sleep-overlay"
        data-asleep={asleep}
      >
        <time className={styles.clock} dateTime={now.toISOString()}>
          {timeHm.format(now)}
        </time>
      </div>
    </div>
  );
}
