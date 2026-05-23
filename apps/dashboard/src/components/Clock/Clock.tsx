import { dateLong, timeHm } from '@home-dashboard/i18n';
import { useClock } from '../../hooks/useClock.js';
import * as styles from './Clock.css.js';

export function Clock() {
  const now = useClock();

  return (
    <div className={styles.clock}>
      <time className={styles.time} dateTime={now.toISOString()}>
        {timeHm.format(now)}
      </time>
      <span className={styles.date}>{dateLong.format(now)}</span>
    </div>
  );
}
