import { z } from 'zod';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

const OpenMeteoResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    wind_direction_10m: z.number(),
    precipitation: z.number(),
    weather_code: z.number(),
    cloud_cover: z.number(),
    surface_pressure: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    apparent_temperature: z.array(z.number()),
    relative_humidity_2m: z.array(z.number()),
    wind_speed_10m: z.array(z.number()),
    wind_direction_10m: z.array(z.number()),
    precipitation: z.array(z.number()),
    precipitation_probability: z.array(z.number()),
    weather_code: z.array(z.number()),
    cloud_cover: z.array(z.number()),
  }),
});

export interface CurrentWeather {
  temperature: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  pressure: number;
}

export interface HourlyForecast {
  forecastTime: string;
  temperature: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  cloudCover: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
}

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
    ].join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'precipitation',
      'precipitation_probability',
      'weather_code',
      'cloud_cover',
    ].join(','),
    forecast_hours: '48',
    timezone: 'auto',
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const parsed = OpenMeteoResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Open-Meteo response validation failed: ${parsed.error.message}`);
  }
  const data = parsed.data;

  // Hourly arrays must align by index — guard against API-side drift before
  // mapping, since z.array doesn't enforce equal lengths.
  const hourlyLength = data.hourly.time.length;
  const aligned = Object.values(data.hourly).every(
    (arr) => Array.isArray(arr) && arr.length === hourlyLength,
  );
  if (!aligned) {
    throw new Error('Open-Meteo hourly arrays have mismatched lengths');
  }

  const current: CurrentWeather = {
    temperature: data.current.temperature_2m,
    apparentTemp: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,
    cloudCover: data.current.cloud_cover,
    pressure: data.current.surface_pressure,
  };

  const hourly: HourlyForecast[] = data.hourly.time.map((time, i) => ({
    forecastTime: new Date(time).toISOString(),
    temperature: data.hourly.temperature_2m[i],
    apparentTemp: data.hourly.apparent_temperature[i],
    humidity: data.hourly.relative_humidity_2m[i],
    windSpeed: data.hourly.wind_speed_10m[i],
    windDirection: data.hourly.wind_direction_10m[i],
    precipitation: data.hourly.precipitation[i],
    precipitationProbability: data.hourly.precipitation_probability[i],
    weatherCode: data.hourly.weather_code[i],
    cloudCover: data.hourly.cloud_cover[i],
  }));

  return { current, hourly };
}
