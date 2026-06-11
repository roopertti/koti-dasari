# syntax=docker/dockerfile:1.7
# Build context: repo root (so workspace deps resolve). See docker-compose.yml.

FROM node:26-alpine@sha256:3ad34ca6292aec4a91d8ddeb9229e29d9c2f689efd0dd242860889ac71842eba AS build
RUN npm install -g corepack@latest && corepack enable
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

FROM nginxinc/nginx-unprivileged:alpine@sha256:85bcbc6b2edd325462560c597d784ecee415024f1c6a004e53ac5f202b8ca561 AS runtime
# Patch openssl for CVE-2026-45447 (libcrypto3/libssl3 < 3.5.7-r0). The Alpine
# fix is published but the upstream image hasn't been rebuilt to include it.
# Remove once nginx-unprivileged:alpine ships libcrypto3/libssl3 >= 3.5.7-r0.
USER root
RUN apk upgrade --no-cache libcrypto3 libssl3
USER nginx
COPY --from=build /repo/apps/dashboard/dist /usr/share/nginx/html
# The upstream entrypoint runs envsubst on /etc/nginx/templates/*.template
# at boot, outputting to /etc/nginx/conf.d/. NGINX_ENVSUBST_FILTER limits
# substitution to KIOSK_API_KEY so nginx's own $host / $remote_addr aren't eaten.
COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER=^KIOSK_API_KEY$

EXPOSE 8080
