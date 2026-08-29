import { t } from '@home-dashboard/i18n';
import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather, getWeatherForecast } from '../../api/weather.js';
import { FocusablePanel } from '../common/FocusablePanel/FocusablePanel.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { WeatherCurrent } from './WeatherCurrent/WeatherCurrent.js';
import { WeatherForecast } from './WeatherForecast/WeatherForecast.js';

const REFRESH_MS = 5 * 60_000;
// One fetch feeds both views: the compact panel shows the next half day, the
// full-screen view the whole day.
const FORECAST_HOURS = 24;
const COMPACT_FORECAST_HOURS = 12;

export function WeatherPanel() {
  const current = useQuery({
    queryKey: ['weather', 'current'],
    queryFn: ({ signal }) => getCurrentWeather(signal),
    refetchInterval: REFRESH_MS,
  });

  const forecast = useQuery({
    queryKey: ['weather', 'forecast', { hours: FORECAST_HOURS }],
    queryFn: ({ signal }) => getWeatherForecast({ hours: FORECAST_HOURS, signal }),
    refetchInterval: REFRESH_MS,
  });

  const forecastData = forecast.data ?? [];
  // Nothing to gain from the full-screen view unless it shows more hours than
  // the compact strip already does.
  const hasMoreHours = forecastData.length > COMPACT_FORECAST_HOURS;

  function renderContent(hours: number) {
    if (current.isPending) {
      return <PanelMessage variant="loading">{t('panel.weather.loading')}</PanelMessage>;
    }

    if (current.error && !current.data) {
      return <PanelMessage variant="error">{current.error.message}</PanelMessage>;
    }

    if (!current.data) {
      return <PanelMessage variant="empty">{t('panel.weather.unavailable')}</PanelMessage>;
    }

    return (
      <>
        <WeatherCurrent data={current.data} />
        {forecastData.length > 0 && <WeatherForecast hours={forecastData} limit={hours} />}
      </>
    );
  }

  return (
    <FocusablePanel
      title={t('panel.weather.title')}
      testId="panel-weather"
      grow="auto"
      expandable={!!current.data && hasMoreHours}
      compact={renderContent(COMPACT_FORECAST_HOURS)}
      expanded={renderContent(FORECAST_HOURS)}
    />
  );
}
