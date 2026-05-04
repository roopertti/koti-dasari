# Home Dashboard - API Specification

## Base URL

```
http://<raspberry-pi-ip>:3001
```

## Authentication

None. The API is unauthenticated and intended to be reached only via the same-origin nginx proxy on the local network. If a second client (different origin or backend caller) is added later, introduce per-client keys validated in Fastify at that point.

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
      "createdAt": "2026-04-10T12:00:00Z",
      "updatedAt": "2026-04-10T12:00:00Z"
    }
  ]
}
```

#### `GET /api/calendar/events/:id`

Get a single calendar event.

**Response:** `200 OK` | `404 Not Found`

#### `POST /api/calendar/events`

Create a new calendar event.

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

Update a calendar event.

**Request Body:** Same as POST (all fields optional except those being changed).

**Response:** `200 OK` | `404 Not Found`

#### `DELETE /api/calendar/events/:id`

Delete a calendar event.

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

Create a new todo.

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

Update a todo.

**Response:** `200 OK` | `404 Not Found`

#### `PATCH /api/todos/:id/toggle`

Toggle todo completion status.

**Response:** `200 OK` | `404 Not Found`

#### `PUT /api/todos/reorder`

Update sort order for multiple todos.

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

Delete a todo.

**Response:** `204 No Content` | `404 Not Found`

---

### Reminders

#### `GET /api/reminders`

List reminders with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `acknowledged` | boolean | Filter by acknowledged status |
| `from` | string | Filter reminders from this time |
| `to` | string | Filter reminders until this time |
| `limit` | number | Max results (default: 50) |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "g7h8i9...",
      "title": "Take medication",
      "description": null,
      "remindAt": "2026-04-15T08:00:00Z",
      "acknowledged": false,
      "recurring": "0 8 * * *",
      "createdAt": "2026-04-10T12:00:00Z",
      "updatedAt": "2026-04-10T12:00:00Z"
    }
  ]
}
```

#### `GET /api/reminders/:id`

Get a single reminder.

**Response:** `200 OK` | `404 Not Found`

#### `POST /api/reminders`

Create a new reminder.

**Request Body:**
```json
{
  "title": "Take medication",
  "description": "Morning vitamins",
  "remindAt": "2026-04-15T08:00:00Z",
  "recurring": "0 8 * * *"
}
```

**Validation:**
- `title`: required, non-empty string
- `remindAt`: required, valid ISO 8601

**Response:** `201 Created`

#### `PUT /api/reminders/:id`

Update a reminder.

**Response:** `200 OK` | `404 Not Found`

#### `PATCH /api/reminders/:id/acknowledge`

Acknowledge a reminder (mark as seen/done).

**Response:** `200 OK` | `404 Not Found`

#### `DELETE /api/reminders/:id`

Delete a reminder.

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
| 404 | `NOT_FOUND` | Resource not found |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

## Field Naming Convention

- Database columns: `snake_case`
- API request/response JSON: `camelCase`
- Kysely handles the mapping via column name transformation
