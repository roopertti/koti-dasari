import type { Generated } from 'kysely';

export interface Database {
  calendar_events: CalendarEventTable;
  todos: TodoTable;
  reminders: ReminderTable;
  transport_stops: TransportStopTable;
  transport_departures: TransportDepartureTable;
  weather_current: WeatherCurrentTable;
  weather_hourly: WeatherHourlyTable;
}

export interface CalendarEventTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: Generated<number>;
  color: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface TodoTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  completed: Generated<number>;
  priority: Generated<'low' | 'medium' | 'high'>;
  due_date: string | null;
  sort_order: Generated<number>;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface ReminderTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  remind_at: string;
  acknowledged: Generated<number>;
  recurring: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface TransportStopTable {
  id: string;
  name: string;
  code: string | null;
  platform: string | null;
  latitude: number;
  longitude: number;
  vehicle_type: 'BUS' | 'TRAM' | 'METRO' | 'TRAIN' | 'FERRY';
  distance_m: number | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface TransportDepartureTable {
  id: Generated<string>;
  stop_id: string;
  route_short_name: string;
  headsign: string;
  scheduled_departure: number;
  realtime_departure: number | null;
  departure_delay: Generated<number>;
  is_realtime: Generated<number>;
  service_day: string;
  vehicle_type: 'BUS' | 'TRAM' | 'METRO' | 'TRAIN' | 'FERRY';
  fetched_at: Generated<string>;
}

export interface WeatherCurrentTable {
  id: Generated<number>;
  temperature: number;
  apparent_temp: number | null;
  humidity: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  precipitation: number | null;
  weather_code: number;
  cloud_cover: number | null;
  pressure: number | null;
  latitude: number;
  longitude: number;
  fetched_at: Generated<string>;
}

export interface WeatherHourlyTable {
  id: Generated<string>;
  forecast_time: string;
  temperature: number;
  apparent_temp: number | null;
  humidity: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  precipitation: number | null;
  precipitation_probability: number | null;
  weather_code: number;
  cloud_cover: number | null;
  fetched_at: Generated<string>;
}
