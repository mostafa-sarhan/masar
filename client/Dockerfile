# syntax=docker/dockerfile:1
# Masar web app (static files on nginx, non-root). Build from the repository root:
#   docker build -f client/Dockerfile --build-arg VITE_API_URL=https://api.example.com .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --no-audit --no-fund -w @masar/shared -w @masar/client --include-workspace-root
COPY shared shared
COPY client client
# Baked in at build time (Vite).
ARG VITE_API_URL
ARG VITE_SENTRY_DSN=
ARG VITE_DEMO_URL=
ARG VITE_APP_VERSION=dev
ENV VITE_API_URL=$VITE_API_URL VITE_SENTRY_DSN=$VITE_SENTRY_DSN VITE_DEMO_URL=$VITE_DEMO_URL VITE_APP_VERSION=$VITE_APP_VERSION
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL is required" && exit 1)
RUN npm run build -w @masar/client

FROM nginxinc/nginx-unprivileged:1.27-alpine
LABEL app=masar component=web
# The template is filled from env (API_ORIGIN, SENTRY_ORIGIN) when the container starts.
COPY deploy/nginx/web.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 CMD wget -qO /dev/null http://127.0.0.1:8080/healthz || exit 1
