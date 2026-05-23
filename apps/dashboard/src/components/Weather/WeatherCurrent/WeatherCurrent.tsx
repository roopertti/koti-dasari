import { t } from '@home-dashboard/i18n';
import type { WeatherCurrent as WeatherCurrentData } from '@home-dashboard/shared';
import { Stat, StatList } from '../../common/Stat/Stat.js';
import { wmoInfo } from '../wmo.js';
import * as styles from './WeatherCurrent.css.js';

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
      <div className={styles.statsRow}>
        <StatList>
          {data.apparentTemp !== null && (
            <Stat
              label={t('panel.weather.stat.feels')}
              value={`${Math.round(data.apparentTemp)}°`}
            />
          )}
          {data.humidity !== null && (
            <Stat label={t('panel.weather.stat.humidity')} value={`${data.humidity}%`} />
          )}
          {data.windSpeed !== null && (
            <Stat
              label={t('panel.weather.stat.wind')}
              value={`${Math.round(data.windSpeed)} km/h`}
            />
          )}
        </StatList>
      </div>
    </div>
  );
}
