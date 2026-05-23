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
│   │   │   ├── App.tsx             # Top-level router: /admin/* → AdminApp, /* → KioskApp
│   │   │   ├── components/
│   │   │   │   ├── Kiosk/          # KioskApp — composes the dashboard panels
│   │   │   │   ├── Layout/         # DashboardLayout, kiosk chrome (paging, swipe)
│   │   │   │   ├── Calendar/       # Kiosk panel
│   │   │   │   ├── Clock/          # Kiosk panel — Clock + Today & Soon rail
│   │   │   │   ├── Todos/          # Kiosk panel
│   │   │   │   ├── Transport/      # Kiosk panel
│   │   │   │   ├── Weather/        # Kiosk panel
│   │   │   │   ├── Admin/          # Admin app (responsive)
│   │   │   │   │   ├── AdminApp.tsx       # Session gate + nested routes
│   │   │   │   │   ├── AdminLayout.tsx    # Header / nav / main shell
│   │   │   │   │   ├── Events/            # Events page = EventsPage + Form + List + queries
│   │   │   │   │   ├── Todos/             # Todos page (same shape as Events)
│   │   │   │   │   ├── Settings/          # Settings page = container + presentational SettingsForm
│   │   │   │   │   ├── Login/             # LoginPage (shown when not authed)
│   │   │   │   │   └── primitives/        # Reusable single-purpose components (see below)
│   │   │   │   │       ├── Button/        # Button.tsx + Button.css.ts (one folder per primitive)
│   │   │   │   │       ├── Checkbox/
│   │   │   │   │       ├── Field/
│   │   │   │   │       ├── Form/          # <form> + 2-column grid layout
│   │   │   │   │       ├── FormActions/   # Right-aligned actions row inside a Form
│   │   │   │   │       ├── Heading/
│   │   │   │   │       ├── Input/
│   │   │   │   │       ├── ListRow/
│   │   │   │   │       ├── NavTab/
│   │   │   │   │       ├── Notice/        # Inline status message (tone: info/error/empty)
│   │   │   │   │       ├── Section/
│   │   │   │   │       ├── Select/
│   │   │   │   │       ├── Textarea/
│   │   │   │   │       └── inputBase.css.ts   # Shared base style for Input/Textarea/Select
│   │   │   │   └── common/         # Cross-area: ErrorBoundary, Pagination, PanelMessage, Stack, …
│   │   │   ├── hooks/              # useAdminSession, useClock, useActivePage, usePointerSwipe, …
│   │   │   ├── api/                # API client functions (admin, calendar, todos, transport, weather)
│   │   │   ├── i18n/               # t() helper + fi.json / en.json catalogs
│   │   │   ├── types/
│   │   │   └── styles/             # theme.css.ts (design tokens, breakpoints)
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
│   ├── worker-weather/             # Open-Meteo data fetcher
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── open-meteo.ts       # Open-Meteo API client
│   │       └── scheduler.ts
│   └── worker-electricity/         # porssisahko.net spot price fetcher
│       ├── package.json
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── porssisahko.ts      # porssisahko.net API client
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
    ├── shared/                     # Shared TypeScript types (calendar, todo, transport, weather, electricity, api)
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── types/
    │       │   ├── api.ts
    │       │   ├── calendar.ts
    │       │   ├── electricity.ts
    │       │   ├── todo.ts
    │       │   ├── transport.ts
    │       │   └── weather.ts
    │       └── index.ts
    ├── i18n/                       # Locale, timezone, date formatters & predicates, t() catalog
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── locale.ts           # LOCALE='fi-FI' + TIMEZONE='Europe/Helsinki'
    │       ├── formatters.ts       # Intl.DateTimeFormat singletons (timeHm, dayHeader, hourShort, …)
    │       ├── dates.ts            # diffDays, horizonFromOffset, parseLocalDate, parseEventStart, departureToDate, …
    │       ├── t.ts                # t(key, params) with FI primary + EN fallback
    │       ├── fi.json
    │       ├── en.json
    │       └── index.ts
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
- Routes:
  - `/` — kiosk dashboard (touch-optimized, fixed viewport)
  - `/admin/*` — responsive admin panel for editing events/todos and tuning runtime settings; gated by PIN + session cookie

#### Component conventions

- **Kiosk vs. admin.** `App.tsx` is a thin router; everything below it lives in either `Kiosk/` (composes the dashboard panels) or `Admin/` (login, layout, feature pages). The kiosk panels themselves (`Calendar/`, `Clock/`, `Todos/`, `Transport/`, `Weather/`, `Layout/`) sit at the top of `components/` and are imported into `KioskApp`.
- **Primitives** (`Admin/primitives/`) are single-purpose reusable components — `Button`, `Input`, `Field`, `Section`, `Heading`, `ListRow`, etc. One folder per primitive (`<Name>/<Name>.tsx` + `<Name>.css.ts`). Page-level code should compose primitives, not raw HTML. The term "widget" is reserved for self-contained features (a clock, a weather panel) — primitives are not widgets.
- **Feature folders** (`Admin/Events/`, `Admin/Todos/`, `Admin/Settings/`) follow a page + form + list shape: a thin `*Page.tsx` orchestrator, a presentational `*Form.tsx` that owns its mutation, a `*List.tsx` that owns its query, and a `queries.ts` for shared query keys / invalidation.
- **Common** (`common/`) holds cross-area utilities that aren't admin-specific (ErrorBoundary, Pagination, PanelMessage, Stack, FullScreenMessage, …).
- **Styling.** Vanilla Extract; tokens in `src/styles/theme.css.ts`. Each component owns its own `.css.ts`. No global element selectors beyond minimal resets; no cross-component `.css.ts` imports — shared base styles live next to their consumers (e.g. `primitives/inputBase.css.ts` is composed by `Input`, `Textarea`, and `Select`).
- **Side effects.** TanStack Query for data; a `key` prop for prop→state resets; `useEffect` is a last resort. Full rules in `.claude/skills/react-ui/SKILL.md`.

### Backend API (api)

- **Fastify** server exposing RESTful endpoints
- All CRUD operations for calendar events and todos
- Read-only endpoints for weather and transport (data populated by workers)
- Uses **Kysely** for type-safe SQL queries against SQLite
- No authentication; reached same-origin via nginx on the local network (see Authentication Strategy)
- CORS configured for local network access

### Runtime Settings

Five tunables — home coordinates, transport search radius, and the two worker fetch intervals — live in a `settings` key/value table. The admin UI edits them via `/api/admin/settings`; both workers re-read the table on every tick, so changes take effect on the next cycle without a restart. Env values (`HOME_LATITUDE`, `HOME_LONGITUDE`, `TRANSPORT_RADIUS`, `TRANSPORT_INTERVAL_MS`, `WEATHER_INTERVAL_MS`) seed defaults at boot when no stored value exists. Secrets (`DIGITRANSIT_API_KEY`, `ADMIN_PIN`, keys) stay in env.

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

#### worker-electricity
- Fetches Finnish Nord Pool spot prices from **porssisahko.net** (no API key needed)
- Stores hourly prices (today + tomorrow when published) in c/kWh including 25.5% VAT
- Smart cadence: every 30 min between 13:00–16:00 Europe/Helsinki (next-day publish window), every 60 min otherwise
- Drops rows older than 48 hours each cycle
- Stores data in SQLite via the shared `@home-dashboard/db` package

### Shared Packages

#### @home-dashboard/db
- Kysely database instance factory
- Table type definitions
- Migration files
- Shared by: api, worker-transport, worker-weather

#### @home-dashboard/shared
- TypeScript type definitions shared between frontend and backend

#### @home-dashboard/i18n
- `LOCALE` (`fi-FI`) + `TIMEZONE` (`Europe/Helsinki`) constants — the single source of truth for both
- Shape-named `Intl.DateTimeFormat` singletons (`timeHm`, `hourShort`, `weekdayShort`, `dayHeader`, `dateLong`, `dueDateShort`, `dateMediumTimeShort`, `helsinkiDayKey`, `helsinkiHour24`) so each format shape exists once instead of being re-instantiated per component
- Local-day date predicates (`diffDays`, `horizonFromOffset`, `parseLocalDate`, `parseEventStart`, `startOfLocalDay`) plus the Digitransit-specific `departureToDate` / `formatDepartureTime`
- The `t(key, params)` translator and the `fi.json` / `en.json` catalogs (FI primary, EN fallback)
- Consumed by the dashboard SPA, `worker-transport`, and `worker-electricity`

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

### porssisahko.net (Electricity spot price)

- **Endpoint**: `https://api.porssisahko.net/v1/latest-prices.json`
- **Auth**: No API key required
- **Data**: Hourly Nord Pool FI spot price for today + tomorrow (tomorrow published ~14:00 EET) in c/kWh including 25.5% VAT
- **Rate limits**: Reasonable for the worker's hourly/30-min cadence

## Authentication Strategy

Two tiers gating the API, plus the LAN boundary. Each is opt-in via env:

1. **API key gate (`/api/*`)** — Fastify pre-handler validates an `x-api-key` header against a comma-separated `API_KEYS` env. Empty/unset disables the gate (dev / first-boot). The kiosk's own nginx injects `KIOSK_API_KEY` on every `/api/` proxy via `proxy_set_header x-api-key …`, so the dashboard SPA never sees the key and a remote client can't impersonate the kiosk. `/api/health` and `/api/admin/*` are exempt from the key check.
2. **Admin session cookie (kiosk's destructive surface)** — `@fastify/secure-session` issues a signed cookie after `POST /api/admin/login { pin }`. The cookie is required by `GET|PUT /api/admin/settings` *and* by every destructive event/todo mutation (`POST|PUT|DELETE /api/calendar/events`, `POST|PUT|DELETE /api/todos`, `PUT /api/todos/reorder`). Reads on every panel and the single kiosk-needed write (`PATCH /api/todos/:id/toggle`) require only the API key. The PIN comes from `ADMIN_PIN`; the cookie is signed with `ADMIN_SESSION_KEY` (32 random bytes as hex). If either is unset, both `/api/admin/*` and the cookie-gated mutations return `503 ADMIN_DISABLED` — i.e. with admin disabled, the API becomes effectively read-only (toggle is the only writable surface).
3. **Same-origin nginx + LAN** — there is no public ingress. The Pi is reachable on its LAN address only.

The two-tier split exists so a leaked kiosk key (which lives in container env on the same Pi as the API) can't be used to wipe events or todos — destruction requires the human PIN flow from a browser. The admin SPA, served by the same nginx that injects the API key, automatically carries both the cookie (after login) and the key (same-origin), so admin mutations Just Work in the UI.

### Adding a second client (e.g., another Pi)

Each client gets its own key so they can be rotated or revoked independently:

```bash
# On the API host, add the new key to .env and restart the api container:
API_KEYS=<kiosk-key>,<second-pi-key>
docker compose up -d api

# On the second Pi (running its own nginx + dashboard), set its KIOSK_API_KEY:
KIOSK_API_KEY=<second-pi-key>
docker compose up -d nginx
```

Rotating: replace the entry in `API_KEYS`, restart the api, redeploy that client's nginx with the new value. Revocation: drop the entry; `api` rejects with 401 on next request.

Out of the box, a second client gets reads on every panel plus the todo-toggle write. To create/edit/delete events or todos from that client, a human still has to log in via `POST /api/admin/login` from a browser — there is intentionally no API-key bypass for destructive operations.

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
├── nginx              (Reverse proxy + static dashboard assets)  Port: 80
├── api                (Fastify server)                           Port: 3001 (internal only)
├── worker-transport   (Long-running Node.js process)             No port
├── worker-weather     (Long-running Node.js process)             No port
└── worker-electricity (Long-running Node.js process)             No port
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

Images are built in GitHub Actions on every push to `main` (`.github/workflows/build-and-push.yml`) and pushed to GHCR as `ghcr.io/roopertti/koti-dasari/{api,worker-transport,worker-weather,worker-electricity,nginx}` tagged `:latest` and `:<short-sha>`. The Pi only ever pulls — it never builds — so the 1 GB Pi 3 has no trouble keeping up.

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
| `API_KEYS` | api | Comma-separated client keys. Empty disables the `/api/*` key check |
| `KIOSK_API_KEY` | nginx | Key injected as `x-api-key` on every `/api/` proxy. Must appear in `API_KEYS` |
| `ADMIN_PIN` | api | Admin login PIN. Empty disables admin (routes return 503) |
| `ADMIN_SESSION_KEY` | api | 32 random bytes as hex (64 chars) used to sign the admin session cookie |
