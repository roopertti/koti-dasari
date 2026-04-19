import { useEffect, useState } from 'react';

export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let intervalId = 0;
    const msToNextSecond = 1000 - (Date.now() % 1000);
    const timeoutId = window.setTimeout(() => {
      setNow(new Date());
      intervalId = window.setInterval(() => setNow(new Date()), 1000);
    }, msToNextSecond);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return now;
}
