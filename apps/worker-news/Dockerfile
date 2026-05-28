# syntax=docker/dockerfile:1.7
# Build context: repo root (so workspace deps resolve). See docker-compose.yml.

FROM node:24-slim AS build
RUN corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/db/package.json ./packages/db/
COPY apps/worker-news/package.json ./apps/worker-news/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @home-dashboard/worker-news... \
      --filter './packages/tsconfig'

COPY packages/db ./packages/db
COPY packages/tsconfig ./packages/tsconfig
COPY apps/worker-news ./apps/worker-news

RUN pnpm --filter @home-dashboard/db build \
 && pnpm --filter @home-dashboard/worker-news build \
 && pnpm --filter @home-dashboard/worker-news deploy --legacy --prod /prod/worker

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node --from=build /prod/worker .
USER node

CMD ["node", "dist/index.js"]
