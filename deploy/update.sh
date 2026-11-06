#!/usr/bin/env bash
# Update Masar: pull the latest code and redeploy every instance that has a .env.<name>.
#   /opt/masar/deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
for env in .env.prod .env.demo; do
  [ -f "$env" ] && deploy/deploy.sh "${env#.env.}"
done
