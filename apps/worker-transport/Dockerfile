# syntax=docker/dockerfile:1.7
# Build context: repo root (so workspace deps resolve). See docker-compose.yml.

FROM node:24-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS build
RUN npm install -g corepack@latest && corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/i18n/package.json ./packages/i18n/
COPY apps/worker-transport/package.json ./apps/worker-transport/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @home-dashboard/worker-transport... \
      --filter './packages/tsconfig'

COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY packages/i18n ./packages/i18n
COPY packages/tsconfig ./packages/tsconfig
COPY apps/worker-transport ./apps/worker-transport

RUN pnpm --filter @home-dashboard/shared build \
 && pnpm --filter @home-dashboard/i18n build \
 && pnpm --filter @home-dashboard/db build \
 && pnpm --filter @home-dashboard/worker-transport build \
 && pnpm --filter @home-dashboard/worker-transport deploy --legacy --prod /prod/worker

FROM node:24-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS runtime
# The runtime only runs `node dist/index.js` — npm is never used here, but its
# bundled dependencies are a recurring source of HIGH CVEs that fail the Trivy
# gate in CI. Drop npm so the final image carries no npm dependency tree.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node --from=build /prod/worker .
USER node

CMD ["node", "dist/index.js"]
