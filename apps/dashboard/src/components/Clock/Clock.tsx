import { useClock } from '../../hooks/useClock.js';
import { LOCALE } from '../../i18n/t.js';
import * as styles from './Clock.css.js';

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
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
