# Home Dashboard

Touchscreen kiosk dashboard for a Raspberry Pi. Shows calendar events, todos, Helsinki public transport departures (HSL), and weather data. Runs entirely on the local network — no cloud services, all data persisted in SQLite.

## Stack

pnpm monorepo. React 19 + Vite frontend, Fastify + Kysely backend, SQLite (better-sqlite3), two Node workers (HSL Digitransit + Open-Meteo), NGINX reverse proxy. Docker Compose for deploy. Biome for lint/format. Playwright for E2E, Vitest for integration tests.

## Quick start (local dev)

Requires Node 24+ and pnpm 10+.

```bash
pnpm install
pnpm dev          # runs all apps in parallel (api, workers, dashboard)
```

The dashboard dev server proxies `/api/*` to the local Fastify instance — see `apps/dashboard/vite.config.ts`.

To run the full production stack locally:

```bash
cp .env.example .env   # fill in DIGITRANSIT_API_KEY at minimum
HOST_PORT=8080 docker compose up --build
# dashboard at http://localhost:8080
```

## Layout

```
apps/
  dashboard/         React 19 + Vite frontend (built into the NGINX image)
  api/               Fastify backend
  worker-transport/  HSL Digitransit fetcher
  worker-weather/    Open-Meteo fetcher
packages/
  db/                Kysely setup, types, migrations
  shared/            Shared TypeScript types
  tsconfig/          Shared TS configs
infra/
  nginx/             Reverse proxy Dockerfile + nginx.conf
  setup-pi.sh        One-time Raspberry Pi setup
docs/                Architecture, database, API, and roadmap docs
```

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — full architecture, Docker layout, deployment flow
- [`docs/API.md`](./docs/API.md) — REST API specification
- [`docs/DATABASE.md`](./docs/DATABASE.md) — table schemas, migration strategy
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — phased implementation plan
- [`CLAUDE.md`](./CLAUDE.md) — project notes for AI-assisted development

## External APIs

- **Digitransit (HSL)** — GraphQL public transport API. Free; requires registration at <https://portal-api.digitransit.fi/>.
- **Open-Meteo** — free weather API, no key required.

## Deployment

Images are built in GitHub Actions and pushed to GHCR on every merge to `main`. The Pi only pulls and runs — it never builds. Full instructions in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#deployment).

```bash
ssh pi@raspberrypi.local 'cd ~/home-dashboard && git pull && docker compose pull && docker compose up -d'
```

## License

[MIT](./LICENSE)
