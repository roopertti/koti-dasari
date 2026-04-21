import { type RefObject, useEffect } from 'react';

// Minimum pointer movement before we commit to a horizontal drag gesture. Below
// this, taps on child elements (buttons, toggles) still register as clicks.
const DRAG_THRESHOLD_PX = 10;

// Flick heuristic: a fast short drag still advances a page even if the pointer
// didn't travel past the midpoint.
const FLICK_MAX_MS = 250;
const FLICK_MIN_PX = 40;

/**
 * Pointer-events-based horizontal drag-to-scroll for a scroll-snap container.
 *
 * Why: Chromium in kiosk mode on Linux can register touchscreen input as mouse
 * events, which don't trigger native touch-pan scrolling. This hook drives
 * scrollLeft manually from pointer events so swipe works regardless.
 */
export function usePointerSwipe(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let startTime = 0;
    let activePointerId: number | null = null;
    let engaged = false;

    const onPointerDown = (e: PointerEvent) => {
      // Only react to primary button for mouse/pen; any touch point is fine.
      if (e.pointerType !== 'touch' && e.button !== 0) {
        return;
      }
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startScrollLeft = el.scrollLeft;
      startTime = e.timeStamp;
      engaged = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) {
        return;
      }
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!engaged) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
          return;
        }
        // Vertical-dominant gesture: bail so the panel can scroll natively.
        if (Math.abs(dx) <= Math.abs(dy)) {
          activePointerId = null;
          return;
        }
        engaged = true;
        el.setPointerCapture(e.pointerId);
      }

      e.preventDefault();
      el.scrollLeft = startScrollLeft - dx;
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) {
        return;
      }
      const wasEngaged = engaged;
      const dx = e.clientX - startX;
      const duration = e.timeStamp - startTime;
      activePointerId = null;
      engaged = false;

      if (!wasEngaged) {
        return;
      }
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }

      const width = el.clientWidth;
      if (width === 0) {
        return;
      }
      const originPage = Math.round(startScrollLeft / width);
      const maxPage = Math.max(0, Math.round((el.scrollWidth - width) / width));

      let target: number;
      if (duration < FLICK_MAX_MS && Math.abs(dx) > FLICK_MIN_PX) {
        target = originPage + (dx > 0 ? -1 : 1);
      } else {
        target = Math.round(el.scrollLeft / width);
      }
      target = Math.max(0, Math.min(maxPage, target));
      el.scrollTo({ left: target * width, behavior: 'smooth' });
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerEnd);
    el.addEventListener('pointercancel', onPointerEnd);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerEnd);
      el.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [containerRef]);
}
