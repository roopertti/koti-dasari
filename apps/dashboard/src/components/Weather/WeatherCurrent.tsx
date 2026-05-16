import type { WeatherCurrent as WeatherCurrentData } from '@home-dashboard/shared';
import { t } from '../../i18n/t.js';
import * as styles from './WeatherPanel.css.js';
import { wmoInfo } from './wmo.js';

interface WeatherCurrentProps {
  data: WeatherCurrentData;
}

export function WeatherCurrent({ data }: WeatherCurrentProps) {
  const info = wmoInfo(data.weatherCode);
  return (
    <div className={styles.current}>
      <div className={styles.currentIcon} aria-hidden="true">
        <info.Icon size="1em" strokeWidth={1.5} />
      </div>
      <div>
        <div className={styles.currentTemp}>{Math.round(data.temperature)}°</div>
        <div className={styles.currentLabel}>{info.label}</div>
      </div>
      <dl className={styles.stats}>
        {data.apparentTemp !== null && (
          <div>
            <dt>{t('panel.weather.stat.feels')}</dt>
            <dd>{Math.round(data.apparentTemp)}°</dd>
          </div>
        )}
        {data.humidity !== null && (
          <div>
            <dt>{t('panel.weather.stat.humidity')}</dt>
            <dd>{data.humidity}%</dd>
          </div>
        )}
        {data.windSpeed !== null && (
          <div>
            <dt>{t('panel.weather.stat.wind')}</dt>
            <dd>{Math.round(data.windSpeed)} km/h</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
