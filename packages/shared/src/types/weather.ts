export interface WeatherCurrent {
  temperature: number;
  apparentTemp: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  precipitation: number | null;
  weatherCode: number;
  cloudCover: number | null;
  pressure: number | null;
  latitude: number;
  longitude: number;
  fetchedAt: string;
}

export interface WeatherHourly {
  forecastTime: string;
  temperature: number;
  apparentTemp: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  weatherCode: number;
  cloudCover: number | null;
}
