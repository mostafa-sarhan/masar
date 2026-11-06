#!/usr/bin/env bash
# Build, back up, migrate and (re)start one instance:  deploy/deploy.sh prod   (or demo)
# Touches only this instance's compose project: other containers, networks and volumes are left alone.
set -euo pipefail
cd "$(dirname "$0")/.."
. deploy/lib.sh
masar_instance "${1:-}"

# Refuse to start if our port is taken by something that isn't this instance.
owner=$(docker ps --format '{{.Names}} {{.Ports}}' | grep -E "127\.0\.0\.1:${WEB_PORT}->" | awk '{print $1}' | head -1 || true)
if [ -n "$owner" ] && [[ "$owner" != "$project"-* ]]; then
  echo "Port ${WEB_PORT} is already used by container '$owner'. Change WEB_PORT in $env." >&2; exit 1
fi
if [ -z "$owner" ] && ss -ltnH "( sport = :${WEB_PORT} )" | grep -q .; then
  echo "Port ${WEB_PORT} is already used by a process on this server. Change WEB_PORT in $env." >&2; exit 1
fi

# The commit being deployed: from the VERSION file that deploy/update.sh ships (the server has no git).
export APP_VERSION="${APP_VERSION:-$(cat VERSION 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)}"
echo "==> [$project] building $APP_VERSION"
compose build

echo "==> [$project] database"
compose up -d --wait mongo

echo "==> [$project] backup before migrating"
mkdir -p "$BACKUP_DIR"
compose run --rm backup || echo "(backup failed or nothing to back up yet)"

echo "==> [$project] migrations"
compose run --rm --no-deps api node dist/scripts/migrate.js > /dev/null

echo "==> [$project] starting"
compose up -d --wait --remove-orphans

echo "==> [$project] health"
curl -fsS "http://127.0.0.1:${WEB_PORT}/api/health"; echo
docker image prune -f --filter "label=app=masar" > /dev/null
echo "Deployed $APP_VERSION to $project (https://$DOMAIN)"
