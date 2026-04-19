import { useClock } from '../../hooks/useClock.js';
import * as styles from './Clock.css.js';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function Clock() {
  const now = useClock();

  return (
    <div className={styles.clock}>
      <time className={styles.time} dateTime={now.toISOString()}>
        {timeFormatter.format(now)}
      </time>
      <span className={styles.date}>{dateFormatter.format(now)}</span>
    </div>
  );
}
