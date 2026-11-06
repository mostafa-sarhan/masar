#!/usr/bin/env bash
# Creates .env.<name> for one instance with fresh secrets, and its MongoDB keyfile.
#   deploy/setup.sh prod     masar.mostafasarhan.tech       → 127.0.0.1:8090
#   deploy/setup.sh demo     demo.masar.mostafasarhan.tech  → 127.0.0.1:8091 (DEMO_MODE=true)
# Re-running keeps existing values. Secrets are never printed.
set -euo pipefail
cd "$(dirname "$0")/.."
name=${1:?usage: deploy/setup.sh <prod|demo>}
env=".env.$name"

if [ ! -f "$env" ]; then
  umask 077
  sed -e "s|^COMPOSE_PROJECT_NAME=.*|COMPOSE_PROJECT_NAME=masar-$name|" \
      -e "s|^MONGO_KEYFILE=.*|MONGO_KEYFILE=./deploy/secrets/$name/mongo-keyfile|" \
      -e "s|^BACKUP_DIR=.*|BACKUP_DIR=/var/backups/masar/$name|" deploy/env.example > "$env"
  case "$name" in
    prod) sed -i -e "s|^DOMAIN=.*|DOMAIN=masar.mostafasarhan.tech|" -e "s|^WEB_PORT=.*|WEB_PORT=8090|" \
            -e "s|^VITE_DEMO_URL=.*|VITE_DEMO_URL=https://demo.masar.mostafasarhan.tech/login|" "$env" ;;
    demo) sed -i -e "s|^DOMAIN=.*|DOMAIN=demo.masar.mostafasarhan.tech|" -e "s|^WEB_PORT=.*|WEB_PORT=8091|" \
            -e "s|^DEMO_MODE=.*|DEMO_MODE=true|" "$env" ;;
    *) echo "New instance '$name': set DOMAIN and WEB_PORT in $env" ;;
  esac
  echo "created $env"
fi
chmod 600 "$env"

fill() { # fill an empty KEY with a random value
  local key=$1 value
  value=$(openssl rand -hex "${2:-32}")
  if grep -qE "^${key}=$" "$env"; then
    sed -i "s|^${key}=$|${key}=${value}|" "$env"
    echo "generated ${key}"
  fi
}
fill JWT_SECRET 48
fill MONGO_ROOT_PASSWORD 24
fill MONGO_APP_PASSWORD 24

keyfile="deploy/secrets/$name/mongo-keyfile"
mkdir -p "deploy/secrets/$name"
chmod 700 deploy/secrets "deploy/secrets/$name"
if [ ! -f "$keyfile" ]; then
  openssl rand -base64 756 > "$keyfile"
  echo "generated $keyfile"
fi
chmod 600 "$keyfile"
echo "Done: review $env, then run deploy/deploy.sh $name"
