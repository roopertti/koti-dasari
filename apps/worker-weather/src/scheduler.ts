import type { Database } from '@home-dashboard/db';
import type { Kysely } from 'kysely';
import { fetchWeather, type WeatherData } from './open-meteo.js';

export interface WeatherSchedulerConfig {
  db: Kysely<Database>;
  latitude: number;
  longitude: number;
  intervalMs: number;
}

export function startScheduler(config: WeatherSchedulerConfig): () => void {
  const { db, latitude, longitude, intervalMs } = config;
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;

  async function tick() {
    if (running) {
      return;
    }
    running = true;

    try {
      console.log('[weather] Fetching weather data...');
      const data = await fetchWeather(latitude, longitude);

      await upsertCurrentWeather(db, data, latitude, longitude);
      await replaceHourlyForecast(db, data);

      console.log(
        `[weather] Cycle complete (current: ${data.current.temperature}°C, ${data.hourly.length} hourly entries)`,
      );
    } catch (err) {
      console.error('[weather] Fetch cycle failed:', err);
    } finally {
      running = false;
    }
  }

  // Run immediately, then on interval
  tick();
  timer = setInterval(tick, intervalMs);

  return () => {
    if (timer) {
      clearInterval(timer);
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
