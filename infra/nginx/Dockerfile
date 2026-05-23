# syntax=docker/dockerfile:1.7
# Build context: repo root (so workspace deps resolve). See docker-compose.yml.

FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/shared/package.json ./packages/shared/
COPY packages/i18n/package.json ./packages/i18n/
COPY apps/dashboard/package.json ./apps/dashboard/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @home-dashboard/dashboard... \
      --filter './packages/tsconfig'

COPY packages/shared ./packages/shared
COPY packages/i18n ./packages/i18n
COPY packages/tsconfig ./packages/tsconfig
COPY apps/dashboard ./apps/dashboard

RUN pnpm --filter @home-dashboard/shared build \
 && pnpm --filter @home-dashboard/i18n build \
 && pnpm --filter @home-dashboard/dashboard build

FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY --from=build /repo/apps/dashboard/dist /usr/share/nginx/html
# The upstream entrypoint runs envsubst on /etc/nginx/templates/*.template
# at boot, outputting to /etc/nginx/conf.d/. NGINX_ENVSUBST_FILTER limits
# substitution to KIOSK_API_KEY so nginx's own $host / $remote_addr aren't eaten.
COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER=^KIOSK_API_KEY$

EXPOSE 8080
