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
- [x] Write Dockerfile for `apps/api/` (multi-stage, node:24-alpine)
- [x] Write Dockerfile for `apps/worker-transport/` (multi-stage, node:24-alpine)
- [x] Write Dockerfile for `apps/worker-weather/` (multi-stage, node:24-alpine)
- [x] Write `infra/nginx/Dockerfile` (multi-stage: build dashboard + serve via nginx:alpine)
- [x] Write `infra/nginx/nginx.conf` (reverse proxy: `/` static, `/api/*` to Fastify, SPA fallback, gzip)
- [x] Write `docker-compose.yml` with all 4 services (nginx, api, worker-transport, worker-weather)
- [x] Configure shared SQLite volume and restart policies
- [x] Add `.env.example` with all environment variables
- [x] Test full stack locally via Docker Compose

#### Deployment Automation
- [x] Write `infra/setup-pi.sh` (one-time Pi setup: install Docker + git, enable BuildKit; run from inside the already-cloned repo)
- [x] Document git-based deploy flow (clone → `git pull` → `docker compose up -d --build`) in `ARCHITECTURE.md`
- [ ] Test deploy to Raspberry Pi
- [ ] Verify health check and all services running on Pi

**Dependency:** Phases 2, 3, 4

---

## Phase 6: Polish & Hardening

Final quality pass.

### Tasks

- [x] Add runtime validation for external API responses (Digitransit, Open-Meteo) before persisting to database — Zod schemas at the worker fetch boundaries
- [x] Add a global error boundary around the dashboard App (toasts skipped — kiosk has no operator to read them; per-panel states cover errors in-place)
- [x] Review and expand E2E test coverage — added reminder-acknowledge spec
- [x] Review and expand API integration test coverage — added PUT /todos/:id spec
- [x] Run Biome across entire codebase, fix any issues
- [x] Verify GitHub Actions CI pipeline (`.github/workflows/ci.yml` — lint, typecheck, build, API tests, E2E; plus `build-and-push.yml` for GHCR)
- [x] Performance test on Raspberry Pi hardware
- [x] Add auto-start on boot (`restart: unless-stopped` on every service in `docker-compose.yml`)
- [x] Write project README

**Skipped:** Extracting business logic from routes into service modules — routes are thin (Kysely + mapping inline) and the API has a single consumer, so layering would add indirection without payoff.

---

## Phase 7: UI Refresh & Localization

Reshape the dashboard's primary surface, drop reminders, replace the todo touch target, and switch the UI to Finnish.

### Tasks

- [ ] Strip reminders from API, dashboard, shared types, and tests; write a `down` migration but leave the table in place to preserve any existing data on the Pi
- [ ] Replace todo round-checkbox with a `Done`-button row mirroring the old `ReminderRow` pattern (larger touch target)
- [ ] Build a "Today & Soon" rail in the dashboard header: events on the current day + todos with `dueDate <= today + 7d`, grouped by horizon (today / tomorrow / this week)
- [ ] Surface overdue todos prominently (color + position at top of the rail)
- [ ] Add a tiny `t(key)` helper that reads a flat JSON catalog (`fi.json` primary, `en.json` fallback)
- [ ] Translate all UI strings to Finnish; English values used when a key is missing
- [ ] Translate WMO weather code descriptions to Finnish

**Dependency:** None (independent UI work)

---

## Phase 8: Admin Panel & LAN Access

Build a LAN-reachable admin UI for editing data, plus per-client API key auth for the second Pi.

### Tasks

#### Admin UI
- [ ] Add an `/admin` route to the same SPA, designed responsive (phone + PC, not kiosk)
- [ ] Form-based create/edit/delete for calendar events
- [ ] Form-based create/edit/delete for todos
- [ ] Settings page editing home location, transport radius, and refresh intervals (move from env vars to a `settings` table; workers re-read on each tick)
- [ ] Server-side session-cookie auth on all `/admin/*` routes, gated by a PIN/password (env-configured)

#### LAN API access
- [ ] Tiny Fastify pre-handler validating an `x-api-key` header against a comma-separated list in env
- [ ] Apply the key check to `/api/*` (admin uses the cookie, not a key)
- [ ] Document the second-Pi setup in `ARCHITECTURE.md` (one key per client, rotation story)

**Dependency:** Phase 7 (settled UI conventions and Finnish strings carry into the admin UI)

---

## Phase 9: iCal Subscribe

Bring real calendars onto the dashboard via public iCal URLs (read-only).

### Tasks

- [ ] Scaffold `apps/worker-calendar/` mirroring the existing worker pattern
- [ ] Fetch and parse one or more public `.ics` URLs on a configurable schedule
- [ ] Add a `source` discriminator on `calendar_events` (`'manual' | 'ical:<url>'`)
- [ ] Persist iCal events idempotently keyed by their iCal `UID`
- [ ] Render synced events visually distinct from manual ones in the dashboard
- [ ] Hide synced events from edit/delete in the admin UI (admin only manages `manual` events)
- [ ] Configure iCal URLs via the Phase 8 settings page (no auth — public published feeds only)

**Dependency:** Phase 8 (settings UI for configuring URLs; admin scoping needs the source discriminator)

---

## Phase 10: Offline Resilience

Keep the kiosk readable during network blips instead of going blank.

### Tasks

- [ ] Persist React Query cache to `localStorage` (or IndexedDB) so reloads show last-known data
- [ ] Add a service worker that caches the SPA shell + static assets
- [ ] Visual stale-data indicator on each panel when the latest fetch failed but cached data is shown

**Dependency:** None (parallel to Phases 7-9)

---

## Phase 11: Hardening & Public Release

Lock supply chain, add scanning, and prep the repo for going public.

### Tasks

#### Supply chain
- [ ] Pin every Docker base image by digest (`node:24-slim@sha256:…`, `nginx:alpine@sha256:…`, `node:24-alpine@sha256:…`)
- [ ] Add Renovate (or Dependabot config) to PR digest bumps automatically
- [ ] `pnpm audit --audit-level=high` step in `.github/workflows/ci.yml`
- [ ] Trivy scan step in `.github/workflows/build-and-push.yml`, fail on HIGH/CRITICAL CVEs

#### Public release
- [ ] Scrub git history for accidentally committed secrets
- [ ] Confirm `.env` (and other secrets) are gitignored and have never been committed
- [ ] Expand `README.md` with screenshots and a fork-and-deploy walkthrough
- [ ] Flip GHCR packages to public visibility (so forkers can pull without a PAT)
- [ ] Verify Dependabot alerts are enabled after the repo goes public

**Skipped:** Pinning npm `package.json` versions exactly — `pnpm-lock.yaml` already locks installed versions and CI uses `--frozen-lockfile`, so the lockfile is the real protection. Pinning `package.json` would only force manual minor bumps without adding security.

**Dependency:** None (can be done at any time, but doing it before going public is the natural ordering)

---

## Implementation Notes

### Recommended Order Within Each Phase

Each phase can largely be done in order, but Phases 2 and 3 can be done **in parallel** since they're independent (both depend only on Phase 1).

```
Phase 1 (scaffolding)
    ├── Phase 2 (API)     ──┐
    └── Phase 3 (workers)  ──┼── Phase 4 (frontend) ── Phase 5 (Docker) ── Phase 6 (polish)

Phase 7 (UI refresh)  ──┬── Phase 8 (admin + LAN) ── Phase 9 (iCal)
Phase 10 (offline)    ──┘  (independent — can land alongside any of 7-9)
Phase 11 (hardening)       (anytime; natural fit before going public)
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
