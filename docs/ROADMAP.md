# Home Dashboard - Implementation Roadmap

## Phase 1: Project Scaffolding

Set up the monorepo structure, tooling, and shared packages.

### Tasks

- [x] Initialize pnpm workspace with `pnpm-workspace.yaml`
- [x] Create root `package.json` with shared scripts (`build`, `dev`, `lint`, `format`, `test`) and `engines: { "node": ">=24" }`
- [x] Create `.npmrc` with `engine-strict=true` to enforce Node 24+
- [x] Set up Biome config (`biome.json`) at root
- [x] Create `packages/tsconfig/` with base, node, and react configs
- [x] Create `packages/shared/` with shared TypeScript types (calendar, todo, transport, weather)
- [x] Create `packages/db/` with Kysely setup, table types, and initial migration
- [x] Verify all packages build and resolve cross-references

**Estimated scope:** Foundation only, no app logic.

---

## Phase 2: Backend API

Build the Fastify API server with full CRUD operations.

### Tasks

- [x] Scaffold `apps/api/` with Fastify + TypeScript
- [x] Create app factory (`app.ts`) with plugin registration
- [x] Implement CORS plugin _(later removed — the same-origin nginx setup makes `/api/*` calls non-cross-origin, so no CORS plugin ships today)_
- [x] Implement API key auth plugin (optional, env-driven)
- [x] Implement health check route (`GET /api/health`)
- [x] Implement calendar events routes (full CRUD)
- [x] Implement todos routes (CRUD + toggle + reorder)
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
- [x] Test deploy to Raspberry Pi
- [x] Verify health check and all services running on Pi

**Dependency:** Phases 2, 3, 4

---

## Phase 6: Polish & Hardening

Final quality pass.

### Tasks

- [x] Add runtime validation for external API responses (Digitransit, Open-Meteo) before persisting to database — Zod schemas at the worker fetch boundaries
- [x] Add a global error boundary around the dashboard App (toasts skipped — kiosk has no operator to read them; per-panel states cover errors in-place)
- [x] Review and expand E2E test coverage
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

- [x] Strip reminders from API, dashboard, shared types, and tests; add migration `002_drop_reminders` (up drops the table, down recreates it). _Note: this destroys any existing reminders on the Pi on next deploy — the original ROADMAP wording suggested preserving them, but we decided a standard drop-in-up migration was cleaner._
- [x] Replace todo round-checkbox with a `Done`-button row mirroring the old `ReminderRow` pattern (larger touch target). Toggle behavior preserved (button reads "Kumoa" when completed).
- [x] Build a "Today & Soon" rail in the dashboard header: events on the current day + todos with `dueDate <= today + 7d`, grouped by horizon (today / tomorrow / this week)
- [x] Surface overdue todos prominently (color + position at top of the rail)
- [x] Add a tiny `t(key)` helper that reads a flat JSON catalog (`fi.json` primary, `en.json` fallback), with `{placeholder}` interpolation
- [x] Translate all UI strings to Finnish; English values used when a key is missing
- [x] Translate WMO weather code descriptions to Finnish

**Dependency:** None (independent UI work)

---

## Phase 8: Admin Panel & LAN Access

Build a LAN-reachable admin UI for editing data, plus per-client API key auth for the second Pi.

### Tasks

#### Admin UI
- [x] Add an `/admin` route to the same SPA, designed responsive (phone + PC, not kiosk)
- [x] Form-based create/edit/delete for calendar events
- [x] Form-based create/edit/delete for todos
- [x] Settings page editing home location, transport radius, and refresh intervals (move from env vars to a `settings` table; workers re-read on each tick)
- [x] Server-side session-cookie auth on all `/admin/*` routes, gated by a PIN/password (env-configured). Session-cookie auth gates the data-mutating admin endpoints; `/api/admin/login`, `/api/admin/logout`, and `/api/admin/session` are intentionally unauthenticated so the SPA can drive the login flow.

#### LAN API access
- [x] Tiny Fastify pre-handler validating an `x-api-key` header against a comma-separated list in env
- [x] Apply the key check to `/api/*` (admin uses the cookie, not a key). `/api/health` is also exempt so container healthchecks stay key-free.
- [x] Document the second-Pi setup in `docs/ARCHITECTURE.md` (one key per client, rotation story)

**Dependency:** Phase 7 (settled UI conventions and Finnish strings carry into the admin UI)

---

## Phase 9: Electricity Spot Price Panel

Add a dashboard panel showing the Finnish electricity spot price (Nord Pool FI area) for the current hour and the next ~24–36 hours, with a chart. Data source: [`porssisahko.net`](https://porssisahko.net/api) — free, no key, returns hourly prices for today + tomorrow (tomorrow's prices published ~14:00 EET) in c/kWh including 25.5% VAT.

### Tasks

#### Data layer
- [x] Add `electricity_prices` table — `hour_start` (ISO, PK), `price_cents_per_kwh` (REAL), `fetched_at` (ISO). Migration `004_electricity_prices` _(numbered after the existing settings migration, not `003` as originally stated)_
- [x] Add Kysely table type in `packages/db/types.ts` and `ElectricityPrice` DTO in `packages/shared`. Zod schema for the `porssisahko.net` response lives next to the worker, matching the Open-Meteo pattern (deviates from "in `packages/shared`" but consistent with existing worker code)

#### Worker
- [x] Scaffold `apps/worker-electricity/` mirroring `worker-weather` (TypeScript, scheduling, graceful shutdown, runtime validation, stale cleanup)
- [x] Fetch on a sensible cadence: every ~30 min during 13:00–16:00 Europe/Helsinki (next-day publish window), otherwise hourly; upsert keyed by `hour_start`
- [x] Drop prices older than 48h to keep the table small

#### API
- [x] Add `GET /api/electricity/prices?from=&to=` (camelCase response, snake_case DB)
- [x] Integration tests for the route

#### Frontend
- [x] Build `Electricity` panel: current price (large), 24h hand-rolled SVG bar chart (no chart dep), tomorrow's prices visually muted until published, color cheap/expensive hours
- [x] Add Finnish + English translations for panel labels, units (`snt/kWh`), and a "tomorrow's prices not yet published" state
- [x] Playwright E2E for panel render + chart presence

#### Infra & docs
- [x] Add Dockerfile for `apps/worker-electricity/` (node:24-slim) and wire into `docker-compose.yml` + `build-and-push.yml`
- [x] Update `docs/DATABASE.md`, `docs/API.md`, `docs/ARCHITECTURE.md` for the new table, route, and worker

**Dependency:** None — independent of Phases 8, 10–19.

---

## Phase 10: `@home-dashboard/i18n` Package (Date & Localization Consolidation)

Tech-debt cleanup: consolidate scattered locale, timezone, and date logic into one workspace package consumed by dashboard, API, and workers.

### Current pain
- `LOCALE = 'fi-FI'` lives only in `apps/dashboard/src/i18n/t.ts`; `worker-transport` hardcodes `'Europe/Helsinki'` separately
- Seven near-duplicate `new Intl.DateTimeFormat(LOCALE, {...})` instances across `Clock`, `TodaySoonRail`, `DepartureRow`, `WeatherForecast`, `CalendarDayGroup`, `TodoRow` — most time formatters use identical options
- Date predicates (`diffDays`, `horizonFromOffset`, `eventStartDate`, `dueDateAsDate`) are buried inside `TodaySoonRail.tsx` instead of being reusable
- `packages/shared/utils/date.ts` only holds Digitransit-specific helpers; nothing dashboard-side imports from there
- `t()` is dashboard-only — Phase 8's admin UI will have introduced its own duplicated translation usage by the time this lands

**Why now:** establishes the reuse pattern for future formatters and translations across new panels/apps — not just dedup of what exists today. Acknowledged as somewhat premature DRY; the value is making "where date/locale code goes" obvious before more code needs it.

### Tasks
- [x] Create `packages/i18n/` workspace package, following the `packages/shared/` shape
- [x] Export `LOCALE` and `TIMEZONE = 'Europe/Helsinki'` constants
- [x] Move catalogs (`fi.json`, `en.json`) and `t()` from `apps/dashboard/src/i18n/` into the package
- [x] Export shared `Intl.DateTimeFormat` singletons (`timeHm`, `hourShort`, `weekdayShort`, `dayHeader`, `dateLong`, `dueDateShort`, `dateMediumTimeShort`, `helsinkiDayKey`, `helsinkiHour24`) named for their shape, not their callers
- [x] Extract `diffDays`, `horizonFromOffset`, `startOfLocalDay`, `parseLocalDate`, `parseEventStart` into the package
- [x] Move `departureToDate` / `formatDepartureTime` from `packages/shared/utils/date.ts` into `packages/i18n` and remove the now-empty file
- [x] Update dashboard components to import formatters and predicates from `@home-dashboard/i18n` (also covers Phase 8 admin UI — its strings already went through `t()` and now resolve via the package)
- [x] Update `worker-transport/src/scheduler.ts` to import `TIMEZONE` instead of hardcoding it. _Also pulled `worker-electricity/src/scheduler.ts` into the cleanup: it had its own local `HELSINKI` constant + ad-hoc `Intl.DateTimeFormat` for the publish-window hour, now both replaced by the shared `TIMEZONE` constant and the `helsinkiHour24` singleton._
- [x] Update `docs/ARCHITECTURE.md` (directory layout + tech section) for the new package
- [x] Verify Biome, typecheck, and tests still pass

**Skipped:** Adding `@home-dashboard/i18n` as a dependency of the API. The API currently has zero date formatting and zero locale-sensitive code paths, so the dependency would be dead weight. Reintroduce when the first real use (e.g. localized error messages) lands.

**Dependency:** Phase 8 (admin UI) — landing this after Phase 8 means admin gets migrated as part of the consolidation rather than refactored twice.

---

## Phase 11: iCal Subscribe

Bring real calendars onto the dashboard via public iCal URLs (read-only).

**v1 scope:** Finnish public holidays + flag days only. Source URL TBD (candidates: Google's `fi.finnish#holiday@group.v.calendar.google.com`, or a community-maintained `.ics`). One feed, hardcoded or env-configured for v1; the settings-page configurability is a v2 stretch goal — don't let it block the holiday data landing.

**Cadence note:** holiday/flag-day feeds change ~once a year. A daily fetch (or even on-startup-only) is sufficient — do **not** copy the 5–30 minute cadence of `worker-weather`, `worker-transport`, `worker-electricity`. The scheduling/`graceful-shutdown` shape of those workers is reusable; the *frequency* is not.

### Tasks

- [x] Scaffold `apps/worker-calendar/` mirroring the existing worker pattern (TypeScript, runtime validation, graceful shutdown) — daily tick at 03:00 Europe/Helsinki (same slot as the nightly DB backup), plus once on startup
- [x] Fetch and parse Google's `fi.finnish#holiday@group.v.calendar.google.com` `.ics` with `ical.js` (Mozilla). Per-VEVENT validation via Zod
- [x] Add migration `005_calendar_source` — `source TEXT NOT NULL DEFAULT 'manual'` and `ical_uid TEXT` on `calendar_events`, plus a unique partial index on `(source, ical_uid)` where `ical_uid IS NOT NULL`
- [x] Persist iCal events idempotently keyed by `(source, ical_uid)`; in the same transaction, drop future-dated rows whose UID disappears from the feed. Past rows expire via the 90-day stale cleanup
- [x] Render synced events visually distinct on the kiosk (FI flag prefix in `CalendarDayGroup` and in the `TodaySoonRail`)
- [x] Hide synced events from `EventsList` in the admin UI — admin only manages `manual` events. Defense-in-depth: the API's `PUT`/`DELETE /api/calendar/events/:id` return `403 READ_ONLY_SOURCE` if the row's `source` is not `manual`
- [ ] **v2 (defer):** make iCal feed URLs configurable via the Phase 8 settings page so additional public feeds can be added without a redeploy

**Dependency:** Phase 8 (admin scoping needs the source discriminator). Settings-page configurability is part of v2, not v1.

---

## Phase 12: Yle News Panel

Add a dashboard panel showing Yle's main news headlines (pääuutiset). Yle (Finland's national broadcaster) publishes a public RSS feed of major headlines — no API key needed. Default feed: `https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss`.

### Tasks

#### Data layer
- [x] Add `news_items` table — `guid` (TEXT PK, RSS `<guid>` for idempotent upsert), `title`, `link`, `summary` (nullable, plain text after HTML strip), `published_at` (ISO 8601), `source` (TEXT, default `'yle'` — leaves room for additional feeds later), `fetched_at`. Migration `006_news_items` _(numbered after Phase 11's `005_calendar_source`, not `005` as originally stated)_
- [x] Add Kysely table type in `packages/db/types.ts` and `NewsItem` DTO in `packages/shared`. Zod schema for the parsed RSS shape lives next to the worker, matching the Open-Meteo / electricity worker pattern

#### Worker
- [x] Scaffold `apps/worker-news/` mirroring `worker-weather` (TypeScript, scheduling, graceful shutdown, runtime validation, stale cleanup)
- [x] Fetch the Yle pääuutiset RSS feed every ~15 min; parse with `fast-xml-parser` (rejected the hand-rolled-regex alternative — Yle's feed embeds CDATA + HTML in `<description>` and regex would be brittle); upsert by `guid`
- [x] Strip HTML from `<description>` before persisting so the panel doesn't have to sanitize on every render
- [x] Drop rows older than 7 days each cycle to keep the table small
- [x] Env var `NEWS_FEED_URL` overrides the default (in case Yle changes the path); `NEWS_INTERVAL_MS` overrides the cadence

#### API
- [x] Add `GET /api/news?limit=` (camelCase response, snake_case DB), default `limit=10`, ordered by `published_at DESC`
- [x] Integration tests for the route

#### Frontend
- [x] Build `News` panel: list of N most recent headlines, each showing title + relative time (e.g. "12 min sitten"). Titles wrap to 2 lines max with ellipsis. Tapping a row opens the QR-code modal described below
- [x] If headline is clicked, there should appear a QR code that can be read with mobile phone to open the actual article on mobile device. QR code can be displayed on a closable modal (uses native `<dialog>`; dismiss via Esc or the close button)
- [x] Empty / loading / error states via the existing `PanelMessage` primitive
- [x] Add Finnish + English translations for panel labels and the "no news available" empty state
- [x] Playwright E2E for panel render + headline list

#### Infra & docs
- [x] Add Dockerfile for `apps/worker-news/` (node:24-slim) and wire into `docker-compose.yml` + `build-and-push.yml`
- [x] Update `docs/DATABASE.md`, `docs/API.md`, `docs/ARCHITECTURE.md` for the new table, route, and worker

**Dependency:** None — independent of Phases 7–11 and 13–19. Best landed after Phase 10 (i18n package) so the new panel's strings go straight into `@home-dashboard/i18n` instead of being migrated later.

---

## Phase 13: Hardening & Public Release

Lock supply chain, add scanning, and prep the repo for going public.

**Public release is a confirmed goal** (decided 2026-05-21) — this is not aspirational. Forkers should be able to clone, set a few env vars, and run.

### Tasks

#### Supply chain
- [x] Pin every Docker base image by digest (`node:24-slim@sha256:…`, `nginxinc/nginx-unprivileged:alpine@sha256:…`, `node:24-alpine@sha256:…`) — initial pin done in this phase; Dependabot keeps them current. _Note: the runtime nginx image is `nginxinc/nginx-unprivileged:alpine`, not the bare `nginx:alpine` listed in the original ROADMAP wording — pinning matches the Dockerfile._
- [x] Dependabot config (`.github/dependabot.yml`) for weekly Docker digest bumps and GitHub Actions version bumps. _Picked Dependabot over Renovate so forkers don't need to install a third-party GitHub App; npm/pnpm updates left to manual review + the new `pnpm audit` CI gate._
- [x] `pnpm audit --audit-level=high` job in `.github/workflows/ci.yml`
- [x] Trivy scan in `.github/workflows/build-and-push.yml` — built image is exported to an OCI tar, scanned with `aquasecurity/trivy-action`, only pushed if HIGH/CRITICAL CVEs are absent. Scanning before push so a vulnerable image never reaches GHCR.

#### Public release
- [x] Scrub git history for accidentally committed secrets — grep across full `git log -p` history for token/key/PIN shapes; only hits were test fixtures (`'kiosk-secret'`, `TEST_ADMIN_PIN = '4242'`) and iCal `BEGIN:VCALENDAR` markers
- [x] Confirm `.env` (and other secrets) are gitignored and have never been committed — `git log -- .env` returns empty; `.env` and `.env.local` in `.gitignore`
- [x] Expand `README.md` with a fork-and-deploy walkthrough. _Screenshots deferred: there are no committed images yet — README has a `TODO(screenshots)` placeholder. Drop `docs/img/dashboard.png` + `docs/img/admin.png` once the Pi is running, then uncomment the block._
- [x] **Manual step (post-merge):** Verify Dependabot alerts are enabled — Repo Settings → Code security and analysis → enable Dependabot alerts + security updates.

**Dependency:** None (can be done at any time, but doing it before going public is the natural ordering)

---

## Phase 14: Error Handling & User Feedback (Admin)

Smaller polish phase. Surface mutation failures to the admin operator (Phase 6 deliberately skipped toasts on the kiosk; the admin UI has a human reading the screen). Also tighten a few places where errors are currently swallowed.

### Tasks

- [x] Add a lightweight toast primitive in `components/common/Toast/` (Vanilla Extract, no extra dep) with a `useToast()` hook backed by a context provider mounted at the admin route root. `ToastProvider` renders a fixed viewport with auto-dismissing toasts (success 4s, error 6s) and is mounted inside `AdminApp` so the kiosk stays toast-free
- [x] Wire `onError` on the silent admin delete mutations (`EventsList`, `TodosList`) to show the API error message as a toast
- [x] Move the inline `setError(err.message)` pattern in `EventsForm` / `TodosForm` / `SettingsForm` to toasts. _Scope decision: **API outcomes only** — save success + API failures are toasts; client-side validation (required / end-after-start) stays inline near the form via `Notice`, since that feedback is immediate and field-local. `SettingsForm` (no client validation) dropped its inline status/error `Notice`s entirely._
- [x] Restore the lost `console.error` on the kiosk `TodosPanel` toggle mutation (regression from the recent useMutation refactor) — kiosk stays toast-free per Phase 6
- [x] Map known API error codes (`{ error: { message, code } }`) to localized strings via `t()` (FI primary, EN fallback) instead of surfacing raw `err.message`. Lives in `@home-dashboard/i18n` as `apiErrorMessage(code, fallback)` (keys `error.api.<CODE>`); the dashboard's `errorToMessage(err)` adapter narrows `ApiRequestError` and falls back to the raw server message for unknown codes. _Note: `VALIDATION_ERROR` maps to a generic localized string, so the server's field-level detail is dropped — client-side validation already covers the common cases._
- [x] Add a separate error boundary at the admin route so an admin crash recovers locally. _Spec framing tweak: kiosk and admin are already route-isolated in `App.tsx` (only one mounts at a time), so this can't "take down the kiosk SPA" regardless — the value is localized recovery without bubbling to the root boundary. Implemented by reusing the existing `ErrorBoundary` around `AdminApp`'s content._
- [x] Playwright: assert a toast appears when a mutation fails (mock the API to 500) — plus a second test asserting a known error code (`READ_ONLY_SOURCE`) maps to its localized toast string

**Dependency:** Phase 8 (admin UI exists). Best landed before Phase 13 so forkers see polished admin UX out of the box. Can stack with Phase 10 (i18n) — the error-code map naturally lives in the new `@home-dashboard/i18n` package if Phase 10 has shipped.

---

## Phase 15: Night Sleep Mode

The kiosk screen burns power overnight while no one's watching. Sleep it on a schedule, wake it on touch or at the configured hour. Highest-value bullet from the original (oversized) Phase 16 — split out so it can ship on its own.

### Tasks

- [ ] Admin settings: sleep start + end times (local time), on/off toggle, optional weekend override (e.g. later wake on Sat/Sun)
- [ ] Frontend: during the sleep window, render a black (or near-black) screen showing only the current time; tap to wake temporarily, auto-resume sleep after a short idle window
- [ ] Wake transition: fade the dashboard back in over ~400–600 ms rather than snapping — same fade when sleep starts. Easier on the eyes at 06:30 and at the night boundary
- [ ] Backend: every worker (transport, weather, electricity, news) reads the sleep window from the `settings` table on each tick and skips fetching while asleep — same re-read-each-tick pattern existing settings use
- [ ] Pi-side screen power: document a small systemd timer or cron job that calls `vcgencmd display_power 0/1` (or DPMS) at the sleep boundaries. Out of scope for the Node containers but referenced from `infra/setup-pi.sh` so forkers get it for free
- [ ] Manual override in admin: a "force wake now" / "force sleep now" button so you can override the schedule without editing the window

**Dependency:** Phase 8 (admin settings table + UI for the sleep window).

---

## Phase 16: Event & Todo Detail Dialogs + Panel Focus

Nice-to-have kiosk UX. Today event/todo descriptions and full panel detail are nowhere to be seen — tapping a row or a panel should reveal more. Bundled because they compose (expanded calendar panel → tap event → detail modal).

### Tasks

#### Detail dialogs
- [ ] Tap on a todo row or calendar event opens a kiosk-friendly modal showing the full description plus available metadata (priority, due date, location, all-day flag, etc.)
- [ ] Read-only on the kiosk — no edit affordances; admin UI remains the only editor
- [ ] Touch-dismissible (tap outside or a large close button); modal sized for kiosk touch targets
- [ ] Reuse existing primitives (e.g. promote `Heading`, `Section`, `Notice` out of `Admin/primitives/` to `common/` so both kiosk and admin share them) rather than introducing a parallel set

#### Panel focus (tap to expand)
- [ ] Tap a whole panel (e.g. transport, calendar, electricity chart) to expand it full-screen with more detail than the compact view shows — e.g. more departures, the full hourly forecast, the full electricity chart
- [ ] Tap outside / a close affordance returns to the normal layout; doubles as a "see more" alternative to swiping between pages
- [ ] Should compose with the detail dialog above (e.g. inside the expanded calendar panel, tapping an event still opens its detail dialog)

**Dependency:** None — independent UI work.

---

## Phase 17: Mobile Admin Discovery via QR

Nice-to-have. Today first-time admin access requires typing the LAN address into a phone. A small QR code on the kiosk would skip that.

### Tasks

- [ ] Render small QR codes on the kiosk linking to `/admin/`, `/admin/events/new`, and `/admin/todos/new` — scan from a phone and skip typing the LAN address
- [ ] Use a tiny build-time-friendly QR lib (e.g. `qrcode-generator`); no network calls
- [ ] Base URL derived from `window.location.origin` at render time so it Just Works on whatever IP/hostname the kiosk is reached by
- [ ] Placement TBD in design pass — candidates: small persistent corner widget, behind a long-press on the header, or inside a "help" overlay. Pick one — don't crowd the panels
- [ ] Verify QR resolves on iOS Camera and Android default camera

**Dependency:** None.

---

## Phase 18: Denser Layout + Idle Auto-Rotate

Nice-to-have. Today only the currently-paged panels are visible at once. Tighter layout fits more, and idle-driven cycling stops the kiosk from getting stuck on the same page indefinitely.

### Tasks

- [ ] Tighten panel heights so more panels fit per page (target: ~3 stacked panels per page instead of the current 2). Verify on the actual Pi touchscreen resolution before locking the heights in
- [ ] **Design call to settle first:** pure timed page-cycling is jarring if a viewer is mid-read. Recommended approach is to cycle only after N minutes of no touch input, pausing immediately when touched and resuming after another idle window. The denser layout above is the primary win; cycling is a fallback for content that still doesn't fit
- [ ] If cycling stays: add page-indicator dots so a glance shows which page you're on
- [ ] Admin settings: rotate interval, idle timeout before rotation starts, on/off toggle

**Dependency:** Phase 8 (admin settings for the rotate options).

---

## Phase 19: Polish & Micro-Interactions

Nice-to-have. Small touches that signal freshness and motion to the viewer. Lowest-priority of the Phase 16 split — ship only after the higher-value phases land.

### Tasks

- [ ] Last-updated stamp on each panel (small muted text, e.g. "päivitetty 2 min sitten") so the viewer can tell at a glance whether data is fresh
- [ ] Brief highlight pulse on a panel right after new data lands — subtle border/ring flash over ~300 ms. Behind an admin toggle (off by default) since opinions differ on whether it's helpful or noisy

**Dependency:** Phase 8 (admin toggle for the highlight pulse).

---

## Implementation Notes

### Recommended Order Within Each Phase

Each phase can largely be done in order, but Phases 2 and 3 can be done **in parallel** since they're independent (both depend only on Phase 1).

```
Phase 1 (scaffolding)
    ├── Phase 2 (API)     ──┐
    └── Phase 3 (workers)  ──┼── Phase 4 (frontend) ── Phase 5 (Docker) ── Phase 6 (polish)

Phase 7  (UI refresh) ── Phase 8 (admin + LAN) ── Phase 10 (i18n pkg) ── Phase 11 (iCal)
Phase 9  (electricity)         (independent of 7+)
Phase 12 (news)                (independent — ideally after 10 so strings land in @home-dashboard/i18n)
Phase 13 (hardening + public)  (anytime; natural fit before going public)
Phase 14 (admin errors)        (depends on 8; ideally before 13)
Phase 15 (night sleep mode)    (depends on 8; highest-value of the kiosk-UX split)
Phase 16 (detail dialogs +     (independent; nice-to-have)
         panel focus)
Phase 17 (mobile admin QR)     (independent; nice-to-have)
Phase 18 (denser layout +      (depends on 8; nice-to-have)
         auto-rotate)
Phase 19 (polish)              (depends on 8; lowest priority)
```

**Suggested next-up order** based on user-value (not numbering): **11 (iCal — real calendar data)** → **15 (night sleep mode)** → **13 (hardening + public)** → **10 (i18n pkg)** → everything else as appetite allows. Phase 12 (news) is real but lower-value than iCal; Phases 16–19 are explicitly nice-to-have.

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
