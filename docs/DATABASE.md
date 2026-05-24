# Home Dashboard - Database Schema

## Overview

All data is stored in a local SQLite database with WAL mode enabled for concurrent read/write support. Kysely is used as the query builder with typed table definitions. Migrations are managed via Kysely's migration system in `packages/db/src/migrations/`.

## Configuration

```typescript
// SQLite pragmas applied on connection
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
```

## Tables

### calendar_events

Stores calendar events with start/end times. Each row carries a `source` discriminator so the admin UI can scope editing to user-created (`manual`) events and exclude synced feeds.

```sql
CREATE TABLE calendar_events (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title         TEXT NOT NULL,
  description   TEXT,
  location      TEXT,
  start_time    TEXT NOT NULL,  -- ISO 8601 datetime
  end_time      TEXT NOT NULL,  -- ISO 8601 datetime
  all_day       INTEGER NOT NULL DEFAULT 0,  -- boolean
  color         TEXT,           -- hex color for UI display
  source        TEXT NOT NULL DEFAULT 'manual',  -- 'manual' | 'ical:<feed-id>'
  ical_uid      TEXT,           -- iCal UID for idempotent upsert (synced rows only)
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_end ON calendar_events(end_time);
CREATE UNIQUE INDEX idx_calendar_events_source_uid
  ON calendar_events(source, ical_uid) WHERE ical_uid IS NOT NULL;
```

`source` values:
- `manual` — user-created via the admin UI
- `ical:<feed-id>` — populated by `worker-calendar` from an iCal feed; currently `ical:finnish-holidays` for the Google-published Finnish public holidays calendar

Synced rows are write-protected by the API (`POST/PUT/DELETE /api/calendar/events` return `403 READ_ONLY_SOURCE` if the row's `source` is not `manual`).

### todos

Stores todo items with optional due dates and priority.

```sql
CREATE TABLE todos (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title         TEXT NOT NULL,
  description   TEXT,
  completed     INTEGER NOT NULL DEFAULT 0,  -- boolean
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  due_date      TEXT,           -- ISO 8601 date (nullable)
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date ON todos(due_date);
```

### transport_stops

Stores nearby public transport stops (populated by worker-transport).

```sql
CREATE TABLE transport_stops (
  id            TEXT PRIMARY KEY,  -- HSL stop ID (e.g., "HSL:1140447")
  name          TEXT NOT NULL,
  code          TEXT,              -- Stop code shown at physical stop
  platform      TEXT,              -- Platform code (for stations)
  latitude      REAL NOT NULL,
  longitude     REAL NOT NULL,
  vehicle_type  TEXT NOT NULL CHECK(vehicle_type IN ('BUS', 'TRAM', 'METRO', 'TRAIN', 'FERRY')),
  distance_m    INTEGER,           -- Distance from home in meters
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### transport_departures

Stores upcoming departures from nearby stops (populated by worker-transport).

```sql
CREATE TABLE transport_departures (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  stop_id           TEXT NOT NULL REFERENCES transport_stops(id) ON DELETE CASCADE,
  route_short_name  TEXT NOT NULL,     -- e.g., "550", "M1", "9"
  headsign          TEXT NOT NULL,     -- Destination name
  scheduled_departure INTEGER NOT NULL, -- Seconds since midnight
  realtime_departure  INTEGER,         -- Seconds since midnight (null if no realtime)
  departure_delay   INTEGER DEFAULT 0, -- Delay in seconds
  is_realtime       INTEGER NOT NULL DEFAULT 0,  -- boolean
  service_day       TEXT NOT NULL,     -- ISO 8601 date (YYYY-MM-DD)
  vehicle_type      TEXT NOT NULL CHECK(vehicle_type IN ('BUS', 'TRAM', 'METRO', 'TRAIN', 'FERRY')),
  fetched_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_departures_stop ON transport_departures(stop_id);
CREATE INDEX idx_departures_service_day ON transport_departures(service_day);
CREATE INDEX idx_departures_time ON transport_departures(service_day, scheduled_departure);
```

### weather_current

Stores the latest current weather observation (one row, updated by worker-weather).

```sql
CREATE TABLE weather_current (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),  -- Single row
  temperature     REAL NOT NULL,      -- Celsius
  apparent_temp   REAL,               -- Feels-like Celsius
  humidity        INTEGER,            -- Percentage
  wind_speed      REAL,               -- km/h
  wind_direction  INTEGER,            -- Degrees
  precipitation   REAL,               -- mm
  weather_code    INTEGER NOT NULL,   -- WMO weather code
  cloud_cover     INTEGER,            -- Percentage
  pressure        REAL,               -- hPa
  latitude        REAL NOT NULL,
  longitude       REAL NOT NULL,
  fetched_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### weather_hourly

Stores hourly weather forecast data (populated by worker-weather).

```sql
CREATE TABLE weather_hourly (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  forecast_time   TEXT NOT NULL,      -- ISO 8601 datetime
  temperature     REAL NOT NULL,      -- Celsius
  apparent_temp   REAL,               -- Feels-like Celsius
  humidity        INTEGER,            -- Percentage
  wind_speed      REAL,               -- km/h
  wind_direction  INTEGER,            -- Degrees
  precipitation   REAL,               -- mm
  precipitation_probability INTEGER,  -- Percentage
  weather_code    INTEGER NOT NULL,   -- WMO weather code
  cloud_cover     INTEGER,            -- Percentage
  fetched_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_weather_hourly_time ON weather_hourly(forecast_time);
```

### electricity_prices

Hourly Finnish spot electricity price (Nord Pool FI area), populated by `worker-electricity` from [porssisahko.net](https://porssisahko.net/api). Prices are in c/kWh including 25.5% VAT.

```sql
CREATE TABLE electricity_prices (
  hour_start            TEXT PRIMARY KEY,         -- ISO 8601 datetime (UTC, top of hour)
  price_cents_per_kwh   REAL NOT NULL,
  fetched_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### settings

Key/value store for admin-tunable runtime settings (home location, transport radius, worker fetch intervals). Each value is a stringified number; the API parses to typed fields. Empty rows fall back to env defaults at the worker.

```sql
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Known keys (snake_case in DB, camelCase in API): `home_latitude`, `home_longitude`, `transport_radius`, `transport_interval_ms`, `weather_interval_ms`.

## WMO Weather Codes Reference

Used in `weather_code` fields. Frontend maps these to icons/descriptions:

| Code | Description |
|------|-------------|
| 0 | Clear sky |
| 1, 2, 3 | Mainly clear, Partly cloudy, Overcast |
| 45, 48 | Fog, Depositing rime fog |
| 51, 53, 55 | Light/Moderate/Dense drizzle |
| 61, 63, 65 | Slight/Moderate/Heavy rain |
| 71, 73, 75 | Slight/Moderate/Heavy snowfall |
| 77 | Snow grains |
| 80, 81, 82 | Slight/Moderate/Violent rain showers |
| 85, 86 | Slight/Heavy snow showers |
| 95 | Thunderstorm |
| 96, 99 | Thunderstorm with slight/heavy hail |

## Kysely Type Definitions

```typescript
// packages/db/src/types.ts

import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  calendar_events: CalendarEventTable;
  todos: TodoTable;
  transport_stops: TransportStopTable;
  transport_departures: TransportDepartureTable;
  weather_current: WeatherCurrentTable;
  weather_hourly: WeatherHourlyTable;
  electricity_prices: ElectricityPriceTable;
  settings: SettingsTable;
}

interface SettingsTable {
  key: string;
  value: string;
  updated_at: Generated<string>;
}

interface CalendarEventTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: number;
  color: string | null;
  source: Generated<string>;
  ical_uid: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

interface TodoTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  completed: number;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  sort_order: number;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

interface TransportStopTable {
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

interface TransportDepartureTable {
  id: Generated<string>;
  stop_id: string;
  route_short_name: string;
  headsign: string;
  scheduled_departure: number;
  realtime_departure: number | null;
  departure_delay: number;
  is_realtime: number;
  service_day: string;
  vehicle_type: 'BUS' | 'TRAM' | 'METRO' | 'TRAIN' | 'FERRY';
  fetched_at: Generated<string>;
}

interface WeatherCurrentTable {
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

interface WeatherHourlyTable {
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

interface ElectricityPriceTable {
  hour_start: string;
  price_cents_per_kwh: number;
  fetched_at: Generated<string>;
}
```

## Migration Strategy

Migrations live in `packages/db/src/migrations/` and are executed on app startup by the API service. Each migration exports `up` and `down` functions.

```typescript
// Example: packages/db/src/migrations/001_initial.ts
import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create all tables
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop all tables
}
```

The API server runs migrations on startup before accepting requests. Workers wait for the DB to be initialized (retry connection with backoff).

## Data Lifecycle

### Transport Departures
- Worker fetches departures every ~5 minutes
- Old departures (past service_day + scheduled_departure) are cleaned up on each fetch
- Stops are upserted (new stops added, existing stops updated)

### Weather Data
- Worker fetches current + hourly forecast every ~30 minutes
- `weather_current` is always a single row (upserted)
- `weather_hourly` rows for past hours are cleaned up on each fetch
- New forecast data replaces old forecast for the same time slots

### Electricity Prices
- Worker fetches every 30 min between 13:00–16:00 Europe/Helsinki (next-day publish window), every 60 min otherwise
- Rows are upserted by `hour_start` so a re-publish for the same hour overwrites
- Rows older than 48 hours are dropped on each cycle

### Calendar (synced iCal feeds)
- `worker-calendar` fetches once on startup, then daily at 03:00 Europe/Helsinki — aligned with the nightly DB backup, matching the natural change cadence of holiday/flag-day feeds
- Upserts keyed by `(source, ical_uid)`; future-dated rows whose UID disappears from a feed are removed in the same transaction
- Rows with `source != 'manual'` whose `end_time` is older than 90 days are pruned each cycle
