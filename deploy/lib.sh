# Shared by the deploy scripts: one instance's settings, and compose for it.
# The env file is read key by key (never executed as shell), so values may contain spaces or symbols.
# shellcheck shell=bash
env_get() { sed -n "s/^$1=//p" "$env" | tail -1 | sed -e 's/^"\(.*\)"$/\1/'; }

masar_instance() {
  name=${1:?instance name required (prod or demo)}
  env=".env.$name"
  [ -f "$env" ] || { echo "Missing $env: run deploy/setup.sh $name first" >&2; exit 1; }
  project=$(env_get COMPOSE_PROJECT_NAME); project=${project:-masar-$name}
  WEB_PORT=$(env_get WEB_PORT)
  DOMAIN=$(env_get DOMAIN)
  BACKUP_DIR=$(env_get BACKUP_DIR)
}
compose() { docker compose -p "$project" -f docker-compose.prod.yml --env-file ".env.$name" "$@"; }
