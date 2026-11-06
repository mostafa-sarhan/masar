#!/usr/bin/env bash
# Build, migrate and (re)start Masar. Run from anywhere on the server:  ./deploy/deploy.sh
# Touches only the "masar" compose project: other containers, networks and volumes are left alone.
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
[ -f .env.prod ] || { echo "Missing .env.prod: run ./deploy/setup.sh first" >&2; exit 1; }
[ -f deploy/secrets/mongo-keyfile ] || { echo "Missing deploy/secrets/mongo-keyfile: run ./deploy/setup.sh first" >&2; exit 1; }
set -a; . ./.env.prod; set +a

# Refuse to start if a port we publish is taken by something that isn't ours.
port_owner() { docker ps --format '{{.Names}} {{.Ports}}' | grep -E "(:|\])$1->" | awk '{print $1}' | head -1; }
check_port() {
  local port=$1 owner
  owner=$(port_owner "$port")
  if [ -n "$owner" ] && [[ "$owner" != masar-* ]]; then
    echo "Port $port is already used by container '$owner'. Change it in .env.prod (or disable the edge profile)." >&2
    exit 1
  fi
  if [ -z "$owner" ] && command -v ss >/dev/null && ss -ltnH "( sport = :$port )" | grep -q .; then
    echo "Port $port is already used by a process on this server. Change it in .env.prod (or disable the edge profile)." >&2
    exit 1
  fi
}
check_port "${WEB_PORT:-5081}"
check_port "${API_PORT:-5080}"
if [[ ",${COMPOSE_PROFILES:-}," == *",edge,"* ]]; then
  check_port "${HTTP_PORT:-80}"
  check_port "${HTTPS_PORT:-443}"
fi

export APP_VERSION="${APP_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)}"
echo "==> Building $APP_VERSION"
"${COMPOSE[@]}" build --pull

echo "==> Starting the database"
"${COMPOSE[@]}" up -d --wait mongo

echo "==> Backing up before migrating"
"${COMPOSE[@]}" run --rm --entrypoint /scripts/backup.sh backup once || echo "(no backup: first deploy?)"

echo "==> Migrating"
"${COMPOSE[@]}" run --rm --no-deps api node dist/scripts/migrate.js

echo "==> Starting the app"
edge=false
[[ ",${COMPOSE_PROFILES:-}," == *",edge,"* ]] && edge=true
has_cert() { "${COMPOSE[@]}" run --rm --no-deps --entrypoint test certbot -f "/etc/letsencrypt/live/${APP_DOMAIN}/fullchain.pem" 2>/dev/null; }
if $edge && ! has_cert; then
  # nginx can't start without a certificate: start the rest, then ./deploy/init-letsencrypt.sh
  "${COMPOSE[@]}" up -d --wait --remove-orphans mongo api web backup
  echo "No certificate yet: run ./deploy/init-letsencrypt.sh (DNS for ${APP_DOMAIN} and ${API_DOMAIN} must point here)"
else
  "${COMPOSE[@]}" up -d --wait --remove-orphans
fi

echo "==> Health"
curl -fsS "http://127.0.0.1:${API_PORT:-5080}/health" && echo
curl -fsS -o /dev/null -w "web %{http_code}\n" "http://127.0.0.1:${WEB_PORT:-5081}/healthz"

# Remove only Masar's own dangling images.
docker image prune -f --filter "label=app=masar" >/dev/null
echo "Deployed $APP_VERSION"
