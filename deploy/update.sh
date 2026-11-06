#!/usr/bin/env bash
# Update Masar on the server — run on your Mac, from the repository:
#   deploy/update.sh            ship the committed code (HEAD), then redeploy prod and demo
#   deploy/update.sh prod       ship, then redeploy prod only (or: demo)
#
# Ships `git archive HEAD` (tracked files only: never .env files, node_modules or local data) over SSH,
# syncs it into /opt/masar on the server while keeping the server's .env.<instance>, deploy/secrets/ and
# backups, writes VERSION, then runs deploy/deploy.sh on the server for each instance.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=${MASAR_HOST:-vps}
DIR=${MASAR_DIR:-/opt/masar}
# (bash 3.2 on macOS: no empty arrays under set -u)
if [ $# -gt 0 ]; then instances=("$@"); else instances=(prod demo); fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes are not shipped (only HEAD is). Commit them first, or continue to ship HEAD." >&2
  read -r -p "Ship HEAD anyway? [y/N] " answer
  [ "$answer" = y ] || exit 1
fi
version=$(git rev-parse --short HEAD)
echo "==> Shipping $version to $HOST:$DIR"
git archive --format=tar HEAD | ssh "$HOST" "set -euo pipefail
  tmp=\$(mktemp -d)
  trap 'rm -rf \"\$tmp\"' EXIT
  tar -x -C \"\$tmp\"
  echo $version > \"\$tmp/VERSION\"
  mkdir -p '$DIR'
  rsync -a --delete --exclude='/.env.*' --exclude='/deploy/secrets/' --exclude='/backups/' \"\$tmp/\" '$DIR/'"

for instance in "${instances[@]}"; do
  echo "==> Deploying $instance"
  ssh "$HOST" "cd '$DIR' && deploy/deploy.sh $instance"
done
echo "Done: $version"
