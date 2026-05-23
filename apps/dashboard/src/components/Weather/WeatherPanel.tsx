import { t } from '@home-dashboard/i18n';
import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather, getWeatherForecast } from '../../api/weather.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { PanelShell } from '../common/PanelShell/PanelShell.js';
import { WeatherCurrent } from './WeatherCurrent/WeatherCurrent.js';
import { WeatherForecast } from './WeatherForecast/WeatherForecast.js';

const REFRESH_MS = 5 * 60_000;
const FORECAST_HOURS = 12;

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

  function renderContent() {
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
        {forecast.data && forecast.data.length > 0 && (
          <WeatherForecast hours={forecast.data} limit={FORECAST_HOURS} />
        )}
      </>
    );
  }

  return (
    <PanelShell title={t('panel.weather.title')} testId="panel-weather" grow="auto">
      {renderContent()}
    </PanelShell>
  );
}
