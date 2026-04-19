# Home Dashboard - Implementation Roadmap

## Phase 1: Project Scaffolding

Set up the monorepo structure, tooling, and shared packages.

### Tasks

- [x] Initialize pnpm workspace with `pnpm-workspace.yaml`
- [x] Create root `package.json` with shared scripts (`build`, `dev`, `lint`, `format`, `test`) and `engines: { "node": ">=24" }`
- [x] Create `.npmrc` with `engine-strict=true` to enforce Node 24+
- [x] Set up Biome config (`biome.json`) at root
- [x] Create `packages/tsconfig/` with base, node, and react configs
- [x] Create `packages/shared/` with shared TypeScript types (calendar, todo, reminder, transport, weather)
- [x] Create `packages/db/` with Kysely setup, table types, and initial migration
- [x] Verify all packages build and resolve cross-references

**Estimated scope:** Foundation only, no app logic.

---

## Phase 2: Backend API

Build the Fastify API server with full CRUD operations.

### Tasks

- [x] Scaffold `apps/api/` with Fastify + TypeScript
- [x] Create app factory (`app.ts`) with plugin registration
- [x] Implement CORS plugin
- [x] Implement API key auth plugin (optional, env-driven)
- [x] Implement health check route (`GET /api/health`)
- [x] Implement calendar events routes (full CRUD)
- [x] Implement todos routes (CRUD + toggle + reorder)
- [x] Implement reminders routes (CRUD + acknowledge)
- [x] Implement transport routes (read-only: stops, departures)
- [x] Implement weather routes (read-only: current, forecast)
- [x] Add request validation with Fastify schemas (or Zod via fastify-type-provider-zod)
- [x] Add snake_case <-> camelCase field mapping
- [x] Write integration tests for all API routes (Vitest)

**Dependency:** Phase 1 (needs `@home-dashboard/db` and `@home-dashboard/shared`)

---

## Phase 3: Workers

Build the data-fetching worker services.

### Tasks

#### worker-transport
- [x] Scaffold `apps/worker-transport/` with TypeScript
- [x] Implement Digitransit GraphQL client
- [x] Implement stop discovery query (`stopsByRadius`)
- [x] Implement departure fetching query (`stoptimesWithoutPatterns`)
- [x] Implement scheduling (configurable interval, e.g., node-cron or setInterval)
- [x] Implement data persistence (upsert stops, replace departures)
- [x] Implement stale data cleanup (remove past departures)
- [x] Add graceful shutdown handling

#### worker-weather
- [x] Scaffold `apps/worker-weather/` with TypeScript
- [x] Implement Open-Meteo API client (current + hourly forecast)
- [x] Implement scheduling (configurable interval)
- [x] Implement data persistence (upsert current weather, replace hourly forecast)
- [x] Implement stale data cleanup (remove past forecast hours)
- [x] Add graceful shutdown handling

**Dependency:** Phase 1 (needs `@home-dashboard/db`)

---

## Phase 4: Frontend Dashboard

Build the React touch-optimized dashboard UI.

### Tasks

- [x] Scaffold `apps/dashboard/` with Vite + React 19 + TypeScript
- [x] Create API client module (`src/api/`) with fetch wrapper
- [x] Design and implement dashboard layout (grid-based, touch-friendly)
- [x] Implement Calendar panel component (shows today's/upcoming events)
- [x] Implement Todos panel component (shows list, toggle completion via touch)
- [x] Implement Reminders panel component (shows active reminders, acknowledge via touch)
- [x] Implement Transport panel component (shows upcoming departures grouped by stop)
- [x] Implement Weather panel component (current conditions + hourly forecast chart/list)
- [x] Add auto-refresh polling (configurable intervals per panel)
- [x] Add clock/date display
- [x] Optimize for kiosk mode (no scrollbars, fixed viewport, touch targets >= 44px)
- [x] Add dark mode / light mode (or auto based on time)
- [x] Write Playwright E2E tests for core flows

**Dependency:** Phase 2 (needs running API to fetch data)

---

## Phase 5: Docker & Deployment

Containerize everything, set up NGINX reverse proxy, and automate Raspberry Pi deployment.

### Tasks

#### Docker & NGINX
- [ ] Write Dockerfile for `apps/api/` (multi-stage, node:24-alpine)
- [ ] Write Dockerfile for `apps/worker-transport/` (multi-stage, node:24-alpine)
- [ ] Write Dockerfile for `apps/worker-weather/` (multi-stage, node:24-alpine)
- [ ] Write `infra/nginx/Dockerfile` (multi-stage: build dashboard + serve via nginx:alpine)
- [ ] Write `infra/nginx/nginx.conf` (reverse proxy: `/` static, `/api/*` to Fastify, SPA fallback, gzip)
- [ ] Write `docker-compose.yml` with all 4 services (nginx, api, worker-transport, worker-weather)
- [ ] Configure shared SQLite volume and restart policies
- [ ] Add `.env.example` with all environment variables
- [ ] Test full stack locally via Docker Compose

#### Deployment Automation
- [ ] Write `infra/setup-pi.sh` (one-time Pi setup: install Docker, create dirs, enable BuildKit)
- [ ] Write `infra/deploy.sh` (rsync project, docker compose up --build, health check, prune)
- [ ] Add rsync exclude list (node_modules, .git, dist, .env.local)
- [ ] Test deploy to Raspberry Pi
- [ ] Verify health check and all services running on Pi

**Dependency:** Phases 2, 3, 4

---

## Phase 6: Polish & Hardening

Final quality pass.

### Tasks

- [ ] Add runtime validation for external API responses (Digitransit, Open-Meteo) before persisting to database
- [ ] Extract business logic from API route files into service modules (routes handle validation + responses only)
- [ ] Review and expand E2E test coverage
- [ ] Review and expand API integration test coverage
- [ ] Run Biome across entire codebase, fix any issues
- [ ] Verify GitHub Actions CI pipeline (`.github/workflows/ci.yml` — already scaffolded)
- [ ] Performance test on Raspberry Pi hardware
- [ ] Add auto-start on boot (systemd service or Docker restart policy)
- [ ] Write project README

---

## Implementation Notes

### Recommended Order Within Each Phase

Each phase can largely be done in order, but Phases 2 and 3 can be done **in parallel** since they're independent (both depend only on Phase 1).

```
Phase 1 (scaffolding)
    ├── Phase 2 (API)     ──┐
    └── Phase 3 (workers)  ──┼── Phase 4 (frontend) ── Phase 5 (Docker) ── Phase 6 (polish)
```

### Key Decisions Made

1. **SQLite over Postgres**: Simpler deployment, no separate DB container, sufficient for single-user dashboard
2. **Open-Meteo over OpenWeatherMap**: No API key needed, generous free tier, good data quality
3. **Digitransit GraphQL**: Official HSL API, requires registration but free to use
4. **Separate workers over cron jobs**: Long-running processes with built-in scheduling are easier to manage in Docker than external cron
5. **API key auth over JWT**: Simple, stateless, sufficient for local network use
6. **camelCase API / snake_case DB**: Standard convention for both JavaScript APIs and SQL databases

### Raspberry Pi Considerations

- Use `node:24-alpine` for smaller image sizes
- Enable Docker BuildKit for faster multi-stage builds
- SQLite WAL mode works well on SD cards (reduces write amplification)
- Consider setting up a RAM disk for the WAL file if SD card wear is a concern
- Touch UI should use large touch targets (44px minimum) and avoid hover states
- Consider screen dimming on idle (can be handled at OS level)
