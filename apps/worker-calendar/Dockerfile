# syntax=docker/dockerfile:1.7
# Build context: repo root (so workspace deps resolve). See docker-compose.yml.

FROM node:25-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS build
RUN npm install -g corepack@latest && corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/db/package.json ./packages/db/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker-calendar/package.json ./apps/worker-calendar/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @home-dashboard/worker-calendar... \
      --filter './packages/tsconfig'

COPY packages/db ./packages/db
COPY packages/i18n ./packages/i18n
COPY packages/shared ./packages/shared
COPY packages/tsconfig ./packages/tsconfig
COPY apps/worker-calendar ./apps/worker-calendar

RUN pnpm --filter @home-dashboard/shared build \
 && pnpm --filter @home-dashboard/i18n build \
 && pnpm --filter @home-dashboard/db build \
 && pnpm --filter @home-dashboard/worker-calendar build \
 && pnpm --filter @home-dashboard/worker-calendar deploy --legacy --prod /prod/worker

FROM node:25-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS runtime
# The runtime only runs `node dist/index.js` — npm is never used here, but its
# bundled dependencies are a recurring source of HIGH CVEs that fail the Trivy
# gate in CI. Drop npm so the final image carries no npm dependency tree.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node --from=build /prod/worker .
USER node

CMD ["node", "dist/index.js"]
