# Home Dashboard

Raspberry Pi touchscreen kiosk dashboard displaying calendar events, todos, Helsinki public transport departures (HSL), and weather data. UI is in Finnish (with English fallback strings).

## Project Structure

pnpm monorepo with workspaces. See `docs/ARCHITECTURE.md` for full details.

```
apps/
  dashboard/    - React 19 + Vite frontend (no own container — built inside NGINX image)
  api/          - Fastify + TypeScript backend API
  worker-transport/ - HSL Digitransit data fetcher
  worker-weather/   - Open-Meteo weather data fetcher
packages/
  db/           - Kysely database setup, types, and migrations (SQLite)
  shared/       - Shared TypeScript types and utilities
  tsconfig/     - Shared TypeScript configurations
infra/
  nginx/        - Reverse proxy Dockerfile + nginx.conf (builds dashboard + serves static + proxies API)
  setup-pi.sh   - One-time Pi setup (Docker, git, BuildKit, nightly backup cron); run from inside the already-cloned repo
docs/           - Architecture, database, API, and roadmap planning documents
```

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, Fastify, TypeScript
- **Database**: SQLite (better-sqlite3), Kysely (query builder + migrations)
- **Workers**: Node.js + TypeScript (standalone long-running services)
- **Containers**: Docker + Docker Compose
- **Testing**: Playwright (E2E), Vitest (integration)
- **Code Quality**: Biome (formatting + linting)

## Key Commands

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start all apps in dev mode
pnpm build                # Build all apps
pnpm lint                 # Run Biome linter
pnpm format               # Run Biome formatter
pnpm test                 # Run all tests
pnpm test:e2e             # Run Playwright E2E tests
pnpm test:integration     # Run API integration tests
docker compose up --build # Build and run full stack
```

## External APIs

- **Digitransit (HSL)**: GraphQL API at `https://api.digitransit.fi/routing/v2/hsl/gtfs/v1`. Requires `digitransit-subscription-key` header. Register at https://portal-api.digitransit.fi/
- **Open-Meteo**: REST API at `https://api.open-meteo.com/v1/forecast`. No API key needed.

## Planning Documents

- `docs/ARCHITECTURE.md` - Full architecture, tech decisions, directory structure, Docker setup, env vars
- `docs/DATABASE.md` - All table schemas, Kysely types, migration strategy, data lifecycle
- `docs/API.md` - Complete REST API specification with all endpoints, request/response shapes
- `docs/ROADMAP.md` - Phased implementation plan with task checklists

## Conventions

- Node.js >= 24 (LTS) required — enforced via `engines` in root `package.json` and `engine-strict=true` in `.npmrc`
- No nested ternaries — use a `renderContent()` helper or early returns instead (not enforceable by Biome 2.x)
- All `if` statements must have curly braces — enforced by Biome (`style/useBlockStatements`)
- Database columns: `snake_case`
- API JSON fields: `camelCase`
- Package names: `@home-dashboard/<name>`
- All dates stored as ISO 8601 strings in SQLite
- Transport departure times stored as seconds since midnight (Digitransit convention)
- Weather codes follow WMO standard (see docs/DATABASE.md for mapping)

## Quality Gates

- **`/review`** — Custom skill that reviews current changes for code quality, test coverage, and project conventions. Run before committing.
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — Runs on push to main and on PRs. Jobs: lint (Biome), typecheck, build, API integration tests, E2E tests. All must pass before merging.

## Development Notes

- SQLite in WAL mode for concurrent read/write from API + workers
- Workers retry DB connection on startup (API runs migrations first)
- API and worker images use `node:24-slim` (so better-sqlite3's arm64 prebuild is used — alpine/musl would force a source compile under QEMU). NGINX uses alpine bases (no native deps).
- All images must be ARM64 compatible for Raspberry Pi deployment
- NGINX is the single entry point (port 80): serves dashboard static assets + proxies `/api/*` to Fastify
- Dashboard has no dedicated container — built inside NGINX's multi-stage Dockerfile
- Images are built in GitHub Actions (`.github/workflows/build-and-push.yml`) and pushed to GHCR on every merge to `main`. Pi deploy: `ssh pi@host 'cd ~/home-dashboard && git pull && docker compose pull && docker compose up -d'` — Pi never builds.
