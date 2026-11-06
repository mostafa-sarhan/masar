#!/usr/bin/env bash
# One backup of an instance's database into its BACKUP_DIR (keeps BACKUP_KEEP_DAYS days).
# Run daily by /etc/cron.d/masar-backup:  deploy/backup-now.sh prod
set -euo pipefail
cd "$(dirname "$0")/.."
. deploy/lib.sh
masar_instance "${1:-}"
mkdir -p "$BACKUP_DIR"
echo "$(date -u '+%F %T') [$project]"
compose run --rm backup
