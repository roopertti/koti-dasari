import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather, getWeatherForecast } from '../../api/weather.js';
import { PanelMessage } from '../common/PanelMessage.js';
import { PanelShell } from '../common/PanelShell.js';
import { WeatherCurrent } from './WeatherCurrent.js';
import { WeatherForecast } from './WeatherForecast.js';

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
      return <PanelMessage variant="loading">Loading…</PanelMessage>;
    }

    if (current.error && !current.data) {
      return <PanelMessage variant="error">{current.error.message}</PanelMessage>;
    }

    if (!current.data) {
      return <PanelMessage variant="empty">Weather unavailable</PanelMessage>;
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
    <PanelShell title="Weather" testId="panel-weather">
      {renderContent()}
    </PanelShell>
  );
}
