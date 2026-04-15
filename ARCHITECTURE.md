# Home Dashboard - Architecture

## Overview

A kiosk-style dashboard application for a Raspberry Pi with a touchscreen display. Shows calendar events, todos, reminders, public transport departures (Helsinki/HSL), and weather data. All data is persisted locally in SQLite and exposed via a REST API for use by other local network apps.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | pnpm workspaces |
| **Frontend** | React 19, TypeScript, Vite |
| **Backend API** | Node.js, Fastify, TypeScript |
| **Database** | SQLite (via better-sqlite3) |
| **Query Builder** | Kysely |
| **Workers** | Node.js, TypeScript (standalone services) |
| **Containerization** | Docker, Docker Compose |
| **Frontend Serving** | NGINX (Alpine-based) |
| **E2E Tests** | Playwright |
| **API Tests** | Vitest (integration tests) |
| **Code Quality** | Biome (formatting + linting) |

## Monorepo Structure

```
home-dashboard/
├── pnpm-workspace.yaml
├── package.json                    # Root package.json (scripts, devDependencies)
├── biome.json                      # Shared Biome config
├── docker-compose.yml
├── CLAUDE.md
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── ROADMAP.md
├── infra/
│   ├── nginx/
│   │   ├── Dockerfile              # Multi-stage: builds dashboard + NGINX
│   │   └── nginx.conf              # Reverse proxy config
│   ├── deploy.sh                   # Deploy to Raspberry Pi via SSH
│   └── setup-pi.sh                # One-time Pi setup (Docker, dirs)
├── apps/
│   ├── dashboard/                  # React frontend
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── playwright.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── Calendar/
│   │   │   │   ├── Todos/
│   │   │   │   ├── Reminders/
│   │   │   │   ├── Transport/
│   │   │   │   ├── Weather/
│   │   │   │   └── Layout/
│   │   │   ├── hooks/
│   │   │   ├── api/                # API client functions
│   │   │   ├── types/
│   │   │   └── styles/
│   │   └── e2e/                    # Playwright tests
│   │       └── *.spec.ts
│   ├── api/                        # Fastify backend
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts            # Server entry point
│   │   │   ├── app.ts              # Fastify app factory
│   │   │   ├── routes/
│   │   │   │   ├── calendar.ts
│   │   │   │   ├── todos.ts
│   │   │   │   ├── reminders.ts
│   │   │   │   ├── transport.ts
│   │   │   │   └── weather.ts
│   │   │   ├── plugins/
│   │   │   │   ├── auth.ts         # API key auth plugin
│   │   │   │   └── cors.ts
│   │   │   └── config.ts
│   │   └── tests/
│   │       └── *.test.ts           # Integration tests
│   ├── worker-transport/           # HSL Digitransit data fetcher
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── digitransit.ts      # Digitransit API client
│   │       └── scheduler.ts        # Cron/interval scheduling
│   └── worker-weather/             # Open-Meteo data fetcher
│       ├── package.json
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── open-meteo.ts       # Open-Meteo API client
│           └── scheduler.ts
└── packages/
    ├── db/                         # Shared database package
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts            # DB connection factory
    │       ├── types.ts            # Kysely table types
    │       └── migrations/
    │           ├── 001_initial.ts
    │           └── ...
    ├── shared/                     # Shared types and utilities
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── types/
    │       │   ├── calendar.ts
    │       │   ├── todo.ts
    │       │   ├── reminder.ts
    │       │   ├── transport.ts
    │       │   └── weather.ts
    │       └── utils/
    │           └── date.ts
    └── tsconfig/                   # Shared TypeScript configs
        ├── package.json
        ├── base.json
        ├── node.json
        └── react.json
```

## Application Architecture

### Frontend (dashboard)

- **React 19** SPA with touch-optimized UI
- Polls the backend API on intervals for data updates
- Designed for a fixed-size touchscreen (likely 7" or 10" display)
- Built with Vite as part of the NGINX Docker image (multi-stage build in `infra/nginx/Dockerfile`)
- No separate container — NGINX serves the static build output directly
- API calls go to `/api/*` on the same origin (NGINX proxies to Fastify)
- Component-based layout with dedicated panels for each data type

### Backend API (api)

- **Fastify** server exposing RESTful endpoints
- All CRUD operations for calendar events, todos, reminders
- Read-only endpoints for weather and transport (data populated by workers)
- Uses **Kysely** for type-safe SQL queries against SQLite
- Optional API key authentication via `x-api-key` header
- CORS configured for local network access

### Workers

Two separate long-running services that fetch external data and persist it to SQLite:

#### worker-transport
- Fetches departures from **Digitransit GraphQL API** (HSL)
- Queries nearby stops by configured coordinates and radius
- Fetches upcoming departures for bus, tram, and metro
- Runs on a configurable schedule (e.g., every 5 minutes during operating hours)
- Stores departures in SQLite via the shared `@home-dashboard/db` package

#### worker-weather
- Fetches weather data from **Open-Meteo API** (no API key needed)
- Gets current conditions + hourly forecast by configured coordinates
- Runs on a configurable schedule (e.g., every 30 minutes)
- Stores weather data in SQLite via the shared `@home-dashboard/db` package

### Shared Packages

#### @home-dashboard/db
- Kysely database instance factory
- Table type definitions
- Migration files
- Shared by: api, worker-transport, worker-weather

#### @home-dashboard/shared
- TypeScript type definitions shared between frontend and backend
- Utility functions (date formatting, etc.)

#### @home-dashboard/tsconfig
- Base TypeScript configurations extended by all apps/packages

## External APIs

### Digitransit (HSL Public Transport)

- **Endpoint**: `https://api.digitransit.fi/routing/v2/hsl/gtfs/v1` (GraphQL)
- **Auth**: Requires API key (register at [Digitransit API Portal](https://portal-api.digitransit.fi/))
- **Key header**: `digitransit-subscription-key`
- **Data**: Stop departures with real-time updates
- **Query**: `stopsByRadius` for nearby stops, `stoptimesWithoutPatterns` for departures
- **Rate limits**: Reasonable for dashboard use (fetching every few minutes)

### Open-Meteo (Weather)

- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Auth**: No API key required (free for non-commercial use)
- **Data**: Current temperature, humidity, wind, precipitation + hourly forecast
- **Rate limits**: 10,000 calls/day (more than sufficient)
- **Params**: latitude, longitude, current/hourly variable selection

## Authentication Strategy

Since the API is on a local network, a lightweight API key approach:

1. API key is configured via environment variable (`API_KEY`)
2. Requests include `x-api-key` header
3. Fastify plugin validates the key on protected routes
4. Dashboard frontend includes the key in its API calls (configured at build time)
5. If no `API_KEY` is set, auth is disabled (development mode)

This keeps things simple while allowing you to lock down the API if needed.

## Docker Architecture

```
Browser (port 80)
    └── nginx (reverse proxy)
            ├── /           → dashboard static files (served directly by nginx)
            ├── /api/*      → fastify backend (api:3001)
            └── /health     → fastify backend (api:3001)
```

```
docker-compose.yml
├── nginx            (Reverse proxy + static dashboard assets)  Port: 80
├── api              (Fastify server)                           Port: 3001 (internal only)
├── worker-transport (Long-running Node.js process)             No port
└── worker-weather   (Long-running Node.js process)             No port
```

- **NGINX is the single entry point** on port 80 — serves the dashboard static build and proxies `/api/*` to Fastify
- The dashboard app has no dedicated container — NGINX's Dockerfile does a multi-stage build of the React app and serves the output directly
- The browser connects to one origin, eliminating CORS issues and the need for a separate `API_URL` config
- All backend services share a Docker volume for the SQLite database file
- Workers and API access the same SQLite DB via the shared volume
- All images use `node:24-alpine` as base (with multi-stage builds)
- ARM64 compatible for Raspberry Pi
- All services use `restart: unless-stopped` for automatic recovery

### NGINX Configuration

The NGINX container is built from `infra/nginx/Dockerfile`:

```dockerfile
# Stage 1: Build the React dashboard
FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @home-dashboard/dashboard build

# Stage 2: Serve via NGINX
FROM nginx:alpine
COPY --from=build /app/apps/dashboard/dist /usr/share/nginx/html
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

The `nginx.conf` handles:
- Serving static assets from `/usr/share/nginx/html` for all non-API routes
- Proxying `/api/` requests to `http://api:3001`
- SPA fallback: all unmatched routes return `index.html` (for client-side routing)
- Gzip compression for static assets
- Cache headers for assets with content hashes

### SQLite Concurrency Note

SQLite supports concurrent reads but only one writer at a time. With WAL mode enabled:
- Multiple readers can read simultaneously
- One writer can write while others read
- Workers write infrequently (every few minutes), so contention is minimal
- Kysely connection should use `busy_timeout` to handle brief lock waits

## Deployment

### Architecture

Deployment is handled via a shell script (`infra/deploy.sh`) run from the dev machine. It connects to the Raspberry Pi over SSH and builds everything on-device (native ARM64, no cross-compilation).

### One-time Pi Setup (`infra/setup-pi.sh`)

Run once on a fresh Pi to prepare the environment:

1. Install Docker and Docker Compose plugin (via official Docker apt repo)
2. Add the current user to the `docker` group
3. Enable Docker to start on boot (`systemctl enable docker`)
4. Create the project directory (`~/home-dashboard`)
5. Enable BuildKit for faster multi-stage builds

### Deploy Script (`infra/deploy.sh`)

```bash
# Usage: ./infra/deploy.sh [user@host]
# Default: pi@raspberrypi.local
```

The deploy script performs these steps:

1. **Pre-flight checks** — verify SSH connectivity and Docker availability on the Pi
2. **Sync project files** — `rsync` the project to the Pi (excludes `node_modules`, `.git`, `dist`)
3. **Copy environment file** — copies `.env.production` to the Pi (if it exists locally)
4. **Build and start** — runs `docker compose up -d --build` on the Pi
5. **Health check** — waits for the API health endpoint to respond on port 80
6. **Cleanup** — prunes unused Docker images to save SD card space

### Redeployment

Subsequent deploys follow the same flow. Docker Compose only rebuilds images whose build context changed, so incremental deploys are fast.

### Directory Structure on Pi

```
~/home-dashboard/
├── docker-compose.yml
├── .env                    # Production environment variables
├── infra/
│   └── nginx/
├── apps/
├── packages/
└── data/                   # Docker volume mount point (SQLite DB lives here)
```

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | api, workers | Path to SQLite database file |
| `API_KEY` | api | Optional API authentication key |
| `DIGITRANSIT_API_KEY` | worker-transport | Digitransit API subscription key |
| `HOME_LATITUDE` | workers | Home location latitude (e.g., `60.1699`) |
| `HOME_LONGITUDE` | workers | Home location longitude (e.g., `24.9384`) |
| `TRANSPORT_RADIUS` | worker-transport | Stop search radius in meters (default: `500`) |
| `TRANSPORT_INTERVAL_MS` | worker-transport | Fetch interval (default: `300000` / 5 min) |
| `WEATHER_INTERVAL_MS` | worker-weather | Fetch interval (default: `1800000` / 30 min) |
| `PORT` | api | API server port (default: `3001`) |
| `DEPLOY_HOST` | deploy script | SSH target (default: `pi@raspberrypi.local`) |
