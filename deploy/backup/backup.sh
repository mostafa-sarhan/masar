#!/bin/sh
# Daily MongoDB backups with rotation.
#   backup.sh          run forever: one backup a day at BACKUP_HOUR (UTC), keep BACKUP_KEEP_DAYS days
#   backup.sh once     one backup now, then exit
# Needs: MONGO_BACKUP_URI (database URI), /backups mounted.
set -eu

KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
HOUR="${BACKUP_HOUR:-1}"   # 01:00 UTC = 03:00 Cairo
DIR=/backups

backup_once() {
  stamp=$(date -u +%Y%m%d-%H%M%S)
  file="$DIR/masar-$stamp.archive.gz"
  echo "[backup] dumping to $file"
  # Write to a temp name first, so a failed dump never looks like a good backup.
  mongodump --uri="$MONGO_BACKUP_URI" --archive="$file.partial" --gzip --quiet
  mv "$file.partial" "$file"
  echo "[backup] done: $(du -h "$file" | cut -f1)"
  # Rotation: delete backups older than KEEP_DAYS days, and leftovers of failed runs.
  find "$DIR" -name 'masar-*.archive.gz' -mtime +"$((KEEP_DAYS - 1))" -print -delete
  find "$DIR" -name '*.partial' -mmin +120 -delete
}

if [ "${1:-}" = "once" ]; then
  backup_once
  exit 0
fi

while true; do
  now=$(date -u +%s)
  next=$(date -u -d "$(date -u +%Y-%m-%d) $HOUR:00:00" +%s)
  [ "$next" -le "$now" ] && next=$((next + 86400))
  echo "[backup] next backup at $(date -u -d "@$next" '+%Y-%m-%d %H:%M') UTC"
  sleep $((next - now))
  backup_once || echo "[backup] FAILED (will retry tomorrow)" >&2
done
