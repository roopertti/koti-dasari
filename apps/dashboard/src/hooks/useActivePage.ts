import { type RefObject, useEffect, useState } from 'react';

export function useActivePage(containerRef: RefObject<HTMLElement | null>): number {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const update = () => {
      const width = container.clientWidth;
      if (width === 0) {
        return;
      }
      setActive(Math.round(container.scrollLeft / width));
    };

    update();
    container.addEventListener('scroll', update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', update);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return active;
}
