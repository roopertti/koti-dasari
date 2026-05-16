# Home Dashboard - Architecture

## Overview

A kiosk-style dashboard application for a Raspberry Pi with a touchscreen display. Shows calendar events, todos, public transport departures (Helsinki/HSL), and weather data. All data is persisted locally in SQLite and exposed via a REST API for use by other local network apps.

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
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   └── ROADMAP.md
├── infra/
│   ├── nginx/
│   │   ├── Dockerfile              # Multi-stage: builds dashboard + NGINX
│   │   └── nginx.conf              # Reverse proxy config
│   └── setup-pi.sh                # One-time Pi setup (Docker, git, BuildKit)
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
│   │   │   │   ├── Clock/          # Clock + Today & Soon rail
│   │   │   │   ├── Todos/
│   │   │   │   ├── Transport/
│   │   │   │   ├── Weather/
│   │   │   │   └── Layout/
│   │   │   ├── hooks/
│   │   │   ├── api/                # API client functions
│   │   │   ├── i18n/               # t() helper + fi.json / en.json catalogs
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
- All CRUD operations for calendar events and todos
- Read-only endpoints for weather and transport (data populated by workers)
- Uses **Kysely** for type-safe SQL queries against SQLite
- No authentication; reached same-origin via nginx on the local network (see Authentication Strategy)
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

The API is unauthenticated. The dashboard reaches it same-origin through nginx on the local network, so no shared secret is needed (and a frontend-bundled key would be readable by anyone with devtools anyway).

If a second client is added later — another browser app on a different origin, or a backend/script caller — introduce per-client API keys at that point, validated in Fastify. Each client gets its own key so they can be rotated or revoked independently. The dashboard itself stays unauthenticated.

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
- API and worker images use `node:24-slim` (debian) so better-sqlite3's prebuilt arm64 binary is used directly — alpine's musl forces a slow source compile under QEMU. NGINX still uses `node:24-alpine` for the dashboard build (no native deps) and `nginx:alpine` at runtime.
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

Images are built in GitHub Actions on every push to `main` (`.github/workflows/build-and-push.yml`) and pushed to GHCR as `ghcr.io/roopertti/koti-dasari/{api,worker-transport,worker-weather,nginx}` tagged `:latest` and `:<short-sha>`. The Pi only ever pulls — it never builds — so the 1 GB Pi 3 has no trouble keeping up.

### One-time Pi Setup (`infra/setup-pi.sh`)

Clone the repo on the Pi (it still needs `docker-compose.yml`, `.env`, and the backup script), then run the script from inside it. The script installs git, Docker + Docker Compose plugin, sqlite3, enables Docker on boot, enables BuildKit, adds the user to the `docker` group, and installs the nightly DB backup cron.

```bash
# On the Pi
ssh pi@raspberrypi.local
git clone git@github.com:roopertti/koti-dasari.git ~/home-dashboard
cd ~/home-dashboard
bash infra/setup-pi.sh
# log out + back in if you were just added to the docker group

# Authenticate to GHCR — generate a fine-grained PAT with `read:packages` scope at
# https://github.com/settings/tokens?type=beta and paste it as the password.
docker login ghcr.io -u <your-github-username>

cp .env.example .env
# edit .env — at minimum set DIGITRANSIT_API_KEY
chmod 600 .env   # restrict to current user only

docker compose pull
docker compose up -d
```

> **Tip:** if you'd rather skip the PAT entirely, on each GitHub package's settings page (Profile → Packages → `<image>` → Package settings) you can flip the package's visibility to public. The repo can stay private; the images become anonymously pullable. Then `docker login ghcr.io` is no longer needed.

### Redeployment

```bash
ssh pi@raspberrypi.local 'cd ~/home-dashboard && git pull && docker compose pull && docker compose up -d'
```

`git pull` only pulls compose/script updates; the new images come from GHCR. To pin a specific build instead of `:latest`, set `IMAGE_TAG=<short-sha>` in `.env` (or as a one-off env var) before `docker compose up -d`. Same mechanism for rollback.

### Directory Structure on Pi

```
~/home-dashboard/
├── docker-compose.yml
├── .env                    # Production environment variables
├── infra/
│   └── nginx/
├── apps/
├── packages/
├── data/                   # Bind-mounted into containers; SQLite DB lives here
└── backups/                # Rotated SQLite snapshots (created by infra/backup.sh)
```

### Backups

`infra/backup.sh` takes an online SQLite snapshot via `sqlite3 .backup` (WAL-safe — no need to stop the API or workers) and writes it to `backups/dashboard-<timestamp>.db`, then prunes to the most recent `KEEP` files (default 14). `setup-pi.sh` installs a nightly cron entry at 03:00; logs go to `backups/backup.log`. To run manually or change retention:

```bash
bash infra/backup.sh              # one-off snapshot
KEEP=30 bash infra/backup.sh      # keep last 30 instead of 14
crontab -l                        # inspect the installed schedule
```

Restoring is a file copy: stop the stack, replace `data/dashboard.db` with the chosen snapshot, restart.

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | api, workers | Path to SQLite database file |
| `DIGITRANSIT_API_KEY` | worker-transport | Digitransit API subscription key |
| `HOME_LATITUDE` | workers | Home location latitude (e.g., `60.1699`) |
| `HOME_LONGITUDE` | workers | Home location longitude (e.g., `24.9384`) |
| `TRANSPORT_RADIUS` | worker-transport | Stop search radius in meters (default: `500`) |
| `TRANSPORT_INTERVAL_MS` | worker-transport | Fetch interval (default: `300000` / 5 min) |
| `WEATHER_INTERVAL_MS` | worker-weather | Fetch interval (default: `1800000` / 30 min) |
| `PORT` | api | API server port (default: `3001`) |
| `HOST_PORT` | nginx | Host port to bind nginx to (default: `80`) |
