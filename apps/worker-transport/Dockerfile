# syntax=docker/dockerfile:1.7
# Build context: repo root (so workspace deps resolve). See docker-compose.yml.

FROM node:24-alpine AS build
RUN corepack enable && apk add --no-cache python3 make g++
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/db/package.json ./packages/db/
COPY apps/worker-transport/package.json ./apps/worker-transport/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @home-dashboard/worker-transport... \
      --filter './packages/tsconfig'

COPY packages/db ./packages/db
COPY packages/tsconfig ./packages/tsconfig
COPY apps/worker-transport ./apps/worker-transport

RUN pnpm --filter @home-dashboard/db build \
 && pnpm --filter @home-dashboard/worker-transport build \
 && pnpm --filter @home-dashboard/worker-transport deploy --legacy --prod /prod/worker

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node --from=build /prod/worker .
USER node

CMD ["node", "dist/index.js"]
