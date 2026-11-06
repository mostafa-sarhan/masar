#!/bin/sh
# Restore a backup made by backup.sh (replaces the collections it contains).
#   restore.sh /backups/masar-20261105-010000.archive.gz
set -eu
file="${1:?usage: restore.sh <backup file>}"
[ -f "$file" ] || { echo "No such file: $file" >&2; exit 1; }
echo "[restore] restoring $file (existing collections in the backup will be replaced)"
mongorestore --uri="$MONGO_BACKUP_URI" --archive="$file" --gzip --drop --quiet
echo "[restore] done"
