# Home Dashboard - API Specification

## Base URL

```
http://<raspberry-pi-ip>:3001
```

## Authentication

Two opt-in layers (see `docs/ARCHITECTURE.md#authentication-strategy`):

1. **API key (`x-api-key` header)** required on all `/api/*` when `API_KEYS` env is non-empty. Exempt: `/api/health`, `/api/admin/*`. The kiosk's nginx injects `KIOSK_API_KEY` automatically; remote clients must send the header themselves.
2. **Admin session cookie** required on `/api/admin/settings` and on all destructive event/todo mutations (see the per-endpoint "Requires admin session cookie" notes below). Obtained via `POST /api/admin/login`. Returns `401 UNAUTHORIZED` if missing; returns `503 ADMIN_DISABLED` when admin is not configured.

Reads (`GET`) on calendar, todos, transport, weather, and electricity require only the API key. The single mutation the kiosk needs — `PATCH /api/todos/:id/toggle` — also requires only the API key. Everything else that writes goes through the admin cookie.

## Common Response Format

All responses follow this structure:

```json
// Success (single item)
{ "data": { ... } }

// Success (list)
{ "data": [ ... ] }

// Error
{ "error": { "message": "...", "code": "NOT_FOUND" } }
```

## Endpoints

---

### Calendar Events

#### `GET /api/calendar/events`

List calendar events, optionally filtered by date range.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `from` | string | Start date filter (ISO 8601, inclusive) |
| `to` | string | End date filter (ISO 8601, inclusive) |
| `limit` | number | Max results (default: 50) |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "a1b2c3...",
      "title": "Team standup",
      "description": "Daily sync",
      "location": "Office",
      "startTime": "2026-04-15T09:00:00Z",
      "endTime": "2026-04-15T09:30:00Z",
      "allDay": false,
      "color": "#4285f4",
      "source": "manual",
      "createdAt": "2026-04-10T12:00:00Z",
      "updatedAt": "2026-04-10T12:00:00Z"
    }
  ]
}
```

`source` is either `"manual"` (user-created via admin UI) or `"ical:<feed-id>"` (populated by `worker-calendar`, e.g. `"ical:finnish-holidays"`). Synced events are read-only — `PUT` and `DELETE` against them return `403 READ_ONLY_SOURCE`.

The iCal `UID` used internally for idempotent upsert is **not** exposed on the API — it is implementation detail of `worker-calendar` and is stripped from all responses.

#### `GET /api/calendar/events/:id`

Get a single calendar event.

**Response:** `200 OK` | `404 Not Found`

#### `POST /api/calendar/events`

Create a new calendar event. **Requires admin session cookie.**

**Request Body:**
```json
{
  "title": "Team standup",
  "description": "Daily sync",
  "location": "Office",
  "startTime": "2026-04-15T09:00:00Z",
  "endTime": "2026-04-15T09:30:00Z",
  "allDay": false,
  "color": "#4285f4"
}
```

**Validation:**
- `title`: required, non-empty string
- `startTime`: required, valid ISO 8601
- `endTime`: required, valid ISO 8601, must be after startTime

**Response:** `201 Created`

#### `PUT /api/calendar/events/:id`

Update a calendar event. **Requires admin session cookie.**

**Request Body:** Same as POST (all fields optional except those being changed).

**Response:** `200 OK` | `404 Not Found`

#### `DELETE /api/calendar/events/:id`

Delete a calendar event. **Requires admin session cookie.**

**Response:** `204 No Content` | `404 Not Found`

---

### Todos

#### `GET /api/todos`

List todos with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `completed` | boolean | Filter by completion status |
| `priority` | string | Filter by priority (`low`, `medium`, `high`) |
| `limit` | number | Max results (default: 50) |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "d4e5f6...",
      "title": "Buy groceries",
      "description": null,
      "completed": false,
      "priority": "medium",
      "dueDate": "2026-04-16",
      "sortOrder": 0,
      "createdAt": "2026-04-15T08:00:00Z",
      "updatedAt": "2026-04-15T08:00:00Z"
    }
  ]
}
```

#### `GET /api/todos/:id`

Get a single todo.

**Response:** `200 OK` | `404 Not Found`

#### `POST /api/todos`

Create a new todo. **Requires admin session cookie.**

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, bread, eggs",
  "priority": "medium",
  "dueDate": "2026-04-16"
}
```

**Validation:**
- `title`: required, non-empty string
- `priority`: optional, one of `low`, `medium`, `high`

**Response:** `201 Created`

#### `PUT /api/todos/:id`

Update a todo. **Requires admin session cookie.**

**Response:** `200 OK` | `404 Not Found`

#### `PATCH /api/todos/:id/toggle`

Toggle todo completion status. This is the one mutation the kiosk performs, so it requires only the API key (no admin cookie).

**Response:** `200 OK` | `404 Not Found`

#### `PUT /api/todos/reorder`

Update sort order for multiple todos. **Requires admin session cookie.**

**Request Body:**
```json
{
  "items": [
    { "id": "d4e5f6...", "sortOrder": 0 },
    { "id": "a1b2c3...", "sortOrder": 1 }
  ]
}
```

**Response:** `200 OK`

#### `DELETE /api/todos/:id`

Delete a todo. **Requires admin session cookie.**

**Response:** `204 No Content` | `404 Not Found`

---

### Transport (Read-only)

Data populated by worker-transport. These endpoints are read-only.

#### `GET /api/transport/stops`

List nearby transport stops.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `vehicleType` | string | Filter by type (`BUS`, `TRAM`, `METRO`, `TRAIN`, `FERRY`) |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "HSL:1140447",
      "name": "Keilaniemi",
      "code": "E1234",
      "platform": null,
      "latitude": 60.1756,
      "longitude": 24.8275,
      "vehicleType": "METRO",
      "distanceM": 350,
      "createdAt": "2026-04-15T06:00:00Z",
      "updatedAt": "2026-04-15T06:00:00Z"
    }
  ]
}
```

#### `GET /api/transport/stops/:id/departures`

List upcoming departures for a specific stop.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Max results (default: 10) |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "j1k2l3...",
      "stopId": "HSL:1140447",
      "routeShortName": "M1",
      "headsign": "Matinkyla",
      "scheduledDeparture": 32400,
      "realtimeDeparture": 32430,
      "departureDelay": 30,
      "isRealtime": true,
      "serviceDay": "2026-04-15",
      "vehicleType": "METRO",
      "fetchedAt": "2026-04-15T08:55:00Z"
    }
  ]
}
```

#### `GET /api/transport/departures`

List all upcoming departures across all stops.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `vehicleType` | string | Filter by vehicle type |
| `limit` | number | Max results (default: 20) |

**Response:** `200 OK` (same shape as stop departures, with stop info included)

---

### Weather (Read-only)

Data populated by worker-weather. These endpoints are read-only.

#### `GET /api/weather/current`

Get current weather conditions.

**Response:** `200 OK`
```json
{
  "data": {
    "temperature": 8.5,
    "apparentTemp": 5.2,
    "humidity": 72,
    "windSpeed": 15.3,
    "windDirection": 220,
    "precipitation": 0.0,
    "weatherCode": 2,
    "cloudCover": 45,
    "pressure": 1013.2,
    "latitude": 60.1699,
    "longitude": 24.9384,
    "fetchedAt": "2026-04-15T08:30:00Z"
  }
}
```

#### `GET /api/weather/forecast`

Get hourly weather forecast.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `hours` | number | Number of forecast hours (default: 24, max: 48) |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "forecastTime": "2026-04-15T09:00:00Z",
      "temperature": 9.0,
      "apparentTemp": 5.8,
      "humidity": 70,
      "windSpeed": 14.0,
      "windDirection": 210,
      "precipitation": 0.0,
      "precipitationProbability": 10,
      "weatherCode": 1,
      "cloudCover": 30
    }
  ]
}
```

---

### Electricity (Read-only)

Data populated by worker-electricity. Read-only endpoint.

#### `GET /api/electricity/prices`

List Nord Pool FI hourly spot prices in c/kWh including VAT 25.5%.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `from` | string | ISO 8601 datetime (inclusive lower bound on `hourStart`) |
| `to` | string | ISO 8601 datetime (inclusive upper bound on `hourStart`) |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "hourStart": "2026-05-20T12:00:00.000Z",
      "priceCentsPerKwh": 3.998,
      "fetchedAt": "2026-05-20T11:45:00.000Z"
    }
  ]
}
```

Results are ordered ascending by `hourStart`. Tomorrow's prices appear after the daily publish (~14:00 EET); absent rows mean the publish has not happened yet.

---

### Admin

Session-cookie authenticated routes for the admin panel. Cookie name: `home-dashboard-admin` (HttpOnly, SameSite=Lax, 14-day expiry). All return `503 ADMIN_DISABLED` if `ADMIN_PIN` or `ADMIN_SESSION_KEY` is unset.

#### `POST /api/admin/login`

**Request Body:** `{ "pin": "1234" }`

**Response:** `200 OK { "data": { "authed": true } }` and a `Set-Cookie: home-dashboard-admin=...` header. `401 UNAUTHORIZED` on wrong PIN.

#### `POST /api/admin/logout`

Clears the session cookie. Always returns `200 OK { "data": { "authed": false } }`.

#### `GET /api/admin/session`

Reports the cookie's auth state.

**Response:** `200 OK { "data": { "authed": boolean, "since": string | null } }`

#### `GET /api/admin/settings`

Returns stored runtime settings (only keys the admin has set; absent keys mean "use env default at the worker").

**Response:** `200 OK`
```json
{
  "data": {
    "homeLatitude": 60.2,
    "homeLongitude": 24.9,
    "transportRadius": 600,
    "transportIntervalMs": 240000,
    "weatherIntervalMs": 1200000
  }
}
```

#### `PUT /api/admin/settings`

Upserts the provided keys. Returns the updated stored snapshot. Each field is range-validated (`homeLatitude` ±90, `homeLongitude` ±180, `transportRadius` 50–10000m, `transportIntervalMs` 30s–1h, `weatherIntervalMs` 1min–6h).

---

### Health Check

#### `GET /api/health`

Health check endpoint (no auth required).

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-04-15T08:00:00Z",
  "version": "1.0.0"
}
```

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body or params |
| 403 | `READ_ONLY_SOURCE` | Mutation attempted on a synced (non-manual) resource |
| 404 | `NOT_FOUND` | Resource not found |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

## Field Naming Convention

- Database columns: `snake_case`
- API request/response JSON: `camelCase`
- Kysely handles the mapping via column name transformation
