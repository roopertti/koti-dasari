import { nextPageIndex, type RotationSettings } from '@home-dashboard/shared';
import { type RefObject, useEffect } from 'react';

/**
 * Idle-gated page cycling for the scroll-snap page container (Phase 18).
 *
 * The kiosk advances one page every `intervalMs`, but only once the screen has
 * gone `idleMs` without a touch — so a viewer mid-read is never yanked to
 * another page. Any pointer press anywhere restarts the idle countdown, which
 * also covers the swipe gesture in `usePointerSwipe`.
 *
 * An open dialog also holds the page: someone reading a detail modal (or
 * scanning a news QR code with their phone) has stopped touching the screen,
 * but they are the opposite of idle.
 */
export function useAutoRotate(
  containerRef: RefObject<HTMLElement | null>,
  rotation: RotationSettings | undefined,
) {
  const enabled = rotation?.enabled ?? false;
  const intervalMs = rotation?.intervalMs ?? 0;
  const idleMs = rotation?.idleMs ?? 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!enabled || intervalMs <= 0 || !el) {
      return;
    }

    let lastInteraction = Date.now();
    const onInteract = () => {
      lastInteraction = Date.now();
    };

    // Capture phase on the window: a press on a panel button counts as
    // interaction even though it never reaches the page container.
    window.addEventListener('pointerdown', onInteract, { capture: true, passive: true });

    const timer = window.setInterval(() => {
      // A backgrounded tab or an open dialog both hold the page.
      if (document.hidden || document.querySelector('dialog[open]')) {
        return;
      }
      if (Date.now() - lastInteraction < idleMs) {
        return;
      }
      const width = el.clientWidth;
      if (width === 0) {
        return;
      }
      const count = Math.round(el.scrollWidth / width);
      const current = Math.round(el.scrollLeft / width);
      el.scrollTo({ left: nextPageIndex(current, count) * width, behavior: 'smooth' });
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pointerdown', onInteract, { capture: true });
    };
  }, [containerRef, enabled, intervalMs, idleMs]);
}
