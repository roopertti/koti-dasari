# syntax=docker/dockerfile:1.7
# Build context: repo root (so workspace deps resolve). See docker-compose.yml.

FROM node:24-alpine AS build
RUN corepack enable && apk add --no-cache python3 make g++
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @home-dashboard/api... \
      --filter './packages/tsconfig'

COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm --filter './packages/*' build \
 && pnpm --filter @home-dashboard/api build \
 && pnpm --filter @home-dashboard/api deploy --legacy --prod /prod/api

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node --from=build /prod/api .
USER node

EXPOSE 3001
CMD ["node", "dist/index.js"]
