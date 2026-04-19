import type { WeatherHourly } from '@home-dashboard/shared';
import * as styles from './WeatherPanel.css.js';
import { wmoInfo } from './wmo.js';

const hourFormatter = new Intl.DateTimeFormat(undefined, {
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
      {hours.slice(0, limit).map((hour) => {
        const info = wmoInfo(hour.weatherCode);
        return (
          <li key={hour.forecastTime} className={styles.forecastHour}>
            <div className={styles.forecastTime}>
              {hourFormatter.format(new Date(hour.forecastTime))}
            </div>
            <div className={styles.forecastIcon} role="img" aria-label={info.label}>
              <info.Icon size="1em" strokeWidth={1.75} />
            </div>
            <div className={styles.forecastTemp}>{Math.round(hour.temperature)}°</div>
            {hour.precipitationProbability !== null && hour.precipitationProbability > 10 && (
              <div className={styles.forecastPrecip}>{hour.precipitationProbability}%</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
