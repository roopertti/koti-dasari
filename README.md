# Home Dashboard

Touchscreen kiosk dashboard for a Raspberry Pi. Shows calendar events, todos,
Helsinki public transport departures (HSL), weather, electricity spot price,
and Yle news headlines. Runs entirely on your local network — no cloud
services, all data persisted in SQLite.

UI is in Finnish (with English fallback strings). LAN-only by design — there
is no public ingress.

<!--
  TODO(screenshots): once a Pi is up, drop dashboard.png + admin.png into
  docs/img/ and uncomment the block below. Until then the README ships
  without images rather than with placeholders that 404.

  ![Kiosk dashboard](docs/img/dashboard.png)
  ![Admin panel](docs/img/admin.png)
-->

## Stack

pnpm monorepo. React 19 + Vite frontend, Fastify + Kysely backend, SQLite
(better-sqlite3), five Node workers (HSL Digitransit, Open-Meteo,
porssisahko.net, Yle RSS, iCal/Google holidays), NGINX reverse proxy.
Docker Compose for deploy. Biome for lint/format. Playwright for E2E,
Vitest for integration tests.

## Quick start (local dev)

Requires Node 24+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env   # fill in DIGITRANSIT_API_KEY at minimum
pnpm dev               # runs all apps in parallel (api, workers, dashboard)
```

The dashboard dev server proxies `/api/*` to the local Fastify instance — see
`apps/dashboard/vite.config.ts`.

To run the full production stack locally via Docker Compose:

```bash
HOST_PORT=8080 docker compose up --build
# dashboard at http://localhost:8080
```

## Example deployment (Raspberry Pi)

A minimal, credentials-free way to bring the whole stack up on a Pi — the
images build locally from source, so there's nothing to log into. (The
maintainer's own setup pulls prebuilt images from a private registry instead;
see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#deployment).)

**One-time setup** (fresh clone on the Pi):

```bash
git clone https://github.com/roopertti/koti-dasari.git ~/home-dashboard
cd ~/home-dashboard
bash infra/setup-pi.sh                 # Docker, sqlite3, BuildKit, nightly backup cron
cp .env.example .env && chmod 600 .env # then fill the secrets below
docker compose up -d --build
```

Secrets to set in `.env`:

- `DIGITRANSIT_API_KEY` — from <https://portal-api.digitransit.fi/>
- `API_KEYS` + `KIOSK_API_KEY` — same value; `openssl rand -hex 24`
- `ADMIN_PIN` — 4–8 digits
- `ADMIN_SESSION_KEY` — `node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))'`

Dashboard at `http://<pi-hostname>.local/`, admin (PIN-gated) at `/admin/`.

**Redeploy** after pulling changes:

```bash
ssh pi@raspberrypi.local 'cd ~/home-dashboard && git pull && docker compose up -d --build'
```

## Configuration overview

| Variable | Required | Purpose |
|---|---|---|
| `DIGITRANSIT_API_KEY` | Yes | HSL public transport API key |
| `API_KEYS` | Yes\* | Comma-separated client keys for `/api/*`. `\*` opt out with `API_AUTH=disabled` (only on trusted networks) |
| `KIOSK_API_KEY` | Yes\* | Key the kiosk's own nginx injects on every `/api/` proxy. Must appear in `API_KEYS` |
| `ADMIN_PIN` | Recommended | 4–8 digit PIN for `/admin/` login. Empty disables admin entirely |
| `ADMIN_SESSION_KEY` | If `ADMIN_PIN` set | 64-char hex string (32 random bytes) signing the admin session cookie |
| `HOME_LATITUDE` / `HOME_LONGITUDE` | No | Default home location; admin UI can override at runtime |
| `HOST_PORT` | No | Host port to bind nginx to (default `80`) |
| `NEWS_FEED_URL` / `NEWS_INTERVAL_MS` | No | Override the Yle news feed and cadence |
| `TRANSPORT_RADIUS` / `TRANSPORT_INTERVAL_MS` | No | Stop-search radius (m) and worker cadence |
| `WEATHER_INTERVAL_MS` | No | Weather worker cadence |

Full list in [`.env.example`](./.env.example) and
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#environment-variables).

Most home-coordinate / interval values are also editable at runtime via the
admin UI — env vars only seed the defaults on first boot.

## Layout

```
apps/
  dashboard/           React 19 + Vite frontend (built into the NGINX image)
  api/                 Fastify backend
  worker-transport/    HSL Digitransit fetcher
  worker-weather/      Open-Meteo fetcher
  worker-electricity/  porssisahko.net spot price fetcher
  worker-calendar/     iCal subscription fetcher (e.g. Finnish holidays)
  worker-news/         Yle RSS news headlines fetcher
packages/
  db/                  Kysely setup, types, migrations
  shared/              Shared TypeScript types
  i18n/                Locale, timezone, formatters, t() catalog
  tsconfig/            Shared TS configs
infra/
  nginx/               Reverse proxy Dockerfile + nginx.conf
  setup-pi.sh          One-time Raspberry Pi setup
  backup.sh            Online SQLite snapshot (called by nightly cron)
docs/                  Architecture, database, API, and roadmap docs
```

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — full architecture, Docker
  layout, deployment, env vars
- [`docs/API.md`](./docs/API.md) — REST API specification
- [`docs/DATABASE.md`](./docs/DATABASE.md) — table schemas, migration strategy
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — phased implementation plan
- [`CLAUDE.md`](./CLAUDE.md) — project notes for AI-assisted development

## External APIs

- **Digitransit (HSL)** — GraphQL public transport API. Free; requires
  registration at <https://portal-api.digitransit.fi/>.
- **Open-Meteo** — free weather API, no key required.
- **porssisahko.net** — free Finnish spot-price API, no key required.
- **Yle RSS** — public news feed, no key required.

## License

[MIT](./LICENSE)
