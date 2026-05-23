# syntax=docker/dockerfile:1.7
# Build context: repo root (so workspace deps resolve). See docker-compose.yml.

FROM node:24-slim AS build
RUN corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/db/package.json ./packages/db/
COPY packages/i18n/package.json ./packages/i18n/
COPY apps/worker-electricity/package.json ./apps/worker-electricity/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @home-dashboard/worker-electricity... \
      --filter './packages/tsconfig'

COPY packages/db ./packages/db
COPY packages/i18n ./packages/i18n
COPY packages/tsconfig ./packages/tsconfig
COPY apps/worker-electricity ./apps/worker-electricity

RUN pnpm --filter @home-dashboard/db build \
 && pnpm --filter @home-dashboard/i18n build \
 && pnpm --filter @home-dashboard/worker-electricity build \
 && pnpm --filter @home-dashboard/worker-electricity deploy --legacy --prod /prod/worker

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node --from=build /prod/worker .
USER node

CMD ["node", "dist/index.js"]
