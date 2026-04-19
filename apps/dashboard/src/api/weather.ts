import type { WeatherCurrent, WeatherHourly } from '@home-dashboard/shared';
import { apiRequest } from './client.js';

export function getCurrentWeather(signal?: AbortSignal): Promise<WeatherCurrent> {
  return apiRequest<WeatherCurrent>('/weather/current', { signal });
}

export function getWeatherForecast(
  params: { hours?: number; signal?: AbortSignal } = {},
): Promise<WeatherHourly[]> {
  const { signal, ...query } = params;
  return apiRequest<WeatherHourly[]>('/weather/forecast', { query, signal });
}
