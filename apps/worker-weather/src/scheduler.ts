import { type DashboardSettings, type Database, resolveSettings } from '@home-dashboard/db';
import type { Kysely } from 'kysely';
import { fetchWeather, type WeatherData } from './open-meteo.js';

export interface WeatherSchedulerConfig {
  db: Kysely<Database>;
  defaults: DashboardSettings;
}

export function startScheduler(config: WeatherSchedulerConfig): () => void {
  const { db, defaults } = config;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = false;

  async function tick() {
    if (running) {
      return;
    }
    running = true;
    let intervalMs = defaults.weatherIntervalMs;

    try {
      const settings = await resolveSettings(db, defaults);
      intervalMs = settings.weatherIntervalMs;

      console.log(
        `[weather] Fetching weather (lat=${settings.homeLatitude}, lon=${settings.homeLongitude})...`,
      );
      const data = await fetchWeather(settings.homeLatitude, settings.homeLongitude);

      await upsertCurrentWeather(db, data, settings.homeLatitude, settings.homeLongitude);
      await replaceHourlyForecast(db, data);

      console.log(
        `[weather] Cycle complete (current: ${data.current.temperature}°C, ${data.hourly.length} hourly entries)`,
      );
    } catch (err) {
      console.error('[weather] Fetch cycle failed:', err);
    } finally {
      running = false;
      if (!stopped) {
        timer = setTimeout(tick, intervalMs);
      }
    }
  }

  tick();

  return () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

async function upsertCurrentWeather(
  db: Kysely<Database>,
  data: WeatherData,
  latitude: number,
  longitude: number,
) {
  const now = new Date().toISOString();
  const { current } = data;

  await db
    .insertInto('weather_current')
    .values({
      id: 1,
      temperature: current.temperature,
      apparent_temp: current.apparentTemp,
      humidity: current.humidity,
      wind_speed: current.windSpeed,
      wind_direction: current.windDirection,
      precipitation: current.precipitation,
      weather_code: current.weatherCode,
      cloud_cover: current.cloudCover,
      pressure: current.pressure,
      latitude,
      longitude,
      fetched_at: now,
    })
    .onConflict((oc) =>
      oc.column('id').doUpdateSet({
        temperature: current.temperature,
        apparent_temp: current.apparentTemp,
        humidity: current.humidity,
        wind_speed: current.windSpeed,
        wind_direction: current.windDirection,
        precipitation: current.precipitation,
        weather_code: current.weatherCode,
        cloud_cover: current.cloudCover,
        pressure: current.pressure,
        latitude,
        longitude,
        fetched_at: now,
      }),
    )
    .execute();
}

async function replaceHourlyForecast(db: Kysely<Database>, data: WeatherData) {
  const now = new Date().toISOString();

  await db.transaction().execute(async (trx) => {
    // Delete all existing forecast data
    await trx.deleteFrom('weather_hourly').execute();

    // Insert new forecast data
    for (const hour of data.hourly) {
      await trx
        .insertInto('weather_hourly')
        .values({
          forecast_time: hour.forecastTime,
          temperature: hour.temperature,
          apparent_temp: hour.apparentTemp,
          humidity: hour.humidity,
          wind_speed: hour.windSpeed,
          wind_direction: hour.windDirection,
          precipitation: hour.precipitation,
          precipitation_probability: hour.precipitationProbability,
          weather_code: hour.weatherCode,
          cloud_cover: hour.cloudCover,
          fetched_at: now,
        })
        .execute();
    }
  });
}
