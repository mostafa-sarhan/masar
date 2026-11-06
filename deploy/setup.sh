#!/usr/bin/env bash
# First-time setup on the server: generates secrets into .env.prod and the MongoDB keyfile.
# Safe to re-run: existing values are kept.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.prod ] || cp .env.prod.example .env.prod
chmod 600 .env.prod

fill() { # fill KEY with a random value if it's empty
  local key=$1 value
  value=$(openssl rand -hex "${2:-32}")
  if grep -qE "^${key}=$" .env.prod; then
    sed -i.bak "s|^${key}=$|${key}=${value}|" .env.prod && rm -f .env.prod.bak
    echo "generated ${key}"
  fi
}
fill JWT_SECRET 48
fill MONGO_ROOT_PASSWORD 24
fill MONGO_APP_PASSWORD 24

mkdir -p deploy/secrets backups
if [ ! -f deploy/secrets/mongo-keyfile ]; then
  openssl rand -base64 756 > deploy/secrets/mongo-keyfile
  echo "generated deploy/secrets/mongo-keyfile"
fi
chmod 600 deploy/secrets/mongo-keyfile

echo "Done. Review .env.prod (domains, LETSENCRYPT_EMAIL, COMPOSE_PROFILES), then run ./deploy/deploy.sh"
