import type { WeatherHourly } from '@home-dashboard/shared';
import { LOCALE } from '../../../i18n/t.js';
import { wmoInfo } from '../wmo.js';
import * as styles from './WeatherForecast.css.js';

const hourFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  hour12: false,
});

interface WeatherForecastProps {
  hours: WeatherHourly[];
  limit: number;
}

export function WeatherForecast({ hours, limit }: WeatherForecastProps) {
  return (
    <ul className={styles.forecast}>
      {hours.slice(0, limit).map((h) => {
        const info = wmoInfo(h.weatherCode);
        return (
          <li key={h.forecastTime} className={styles.hour}>
            <div className={styles.time}>{hourFormatter.format(new Date(h.forecastTime))}</div>
            <div className={styles.icon} role="img" aria-label={info.label}>
              <info.Icon size="1em" strokeWidth={1.75} />
            </div>
            <div className={styles.temp}>{Math.round(h.temperature)}°</div>
            {h.precipitationProbability !== null && h.precipitationProbability > 10 && (
              <div className={styles.precip}>{h.precipitationProbability}%</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
