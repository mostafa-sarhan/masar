#!/usr/bin/env bash
# First certificate for APP_DOMAIN + API_DOMAIN (edge profile only). Run once after the first deploy,
# when both DNS records point at this server. Renewal is automatic (certbot service).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.prod; set +a
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
: "${APP_DOMAIN:?}" "${API_DOMAIN:?}" "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL in .env.prod}"
live="/etc/letsencrypt/live/${APP_DOMAIN}"

echo "==> Temporary self-signed certificate so nginx can start"
"${COMPOSE[@]}" run --rm --entrypoint sh certbot -c "mkdir -p $live && [ -f $live/fullchain.pem ] || openssl req -x509 -nodes -newkey rsa:2048 -days 1 -keyout $live/privkey.pem -out $live/fullchain.pem -subj /CN=localhost"
"${COMPOSE[@]}" up -d proxy

echo "==> Requesting the real certificate"
"${COMPOSE[@]}" run --rm --entrypoint sh certbot -c "rm -rf $live /etc/letsencrypt/archive/${APP_DOMAIN} /etc/letsencrypt/renewal/${APP_DOMAIN}.conf"
"${COMPOSE[@]}" run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
  --cert-name "$APP_DOMAIN" -d "$APP_DOMAIN" -d "$API_DOMAIN" \
  --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email --non-interactive

"${COMPOSE[@]}" exec proxy nginx -s reload
echo "HTTPS ready: https://${APP_DOMAIN} and https://${API_DOMAIN}"
