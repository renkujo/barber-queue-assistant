#!/bin/sh

set -eu

if [ "${R2_BACKUP_ENABLED:-false}" != "true" ]; then
  exit 0
fi

MARKER='/tmp/postgres-r2-backup-last-success'
INTERVAL_HOURS="${R2_BACKUP_INTERVAL_HOURS:-24}"

if [ ! -f "$MARKER" ]; then
  echo "No successful R2 backup has been recorded." >&2
  exit 1
fi

case "$INTERVAL_HOURS" in
  ''|*[!0-9]*) exit 1 ;;
esac

NOW="$(date +%s)"
LAST_SUCCESS="$(stat -c %Y "$MARKER")"
MAX_AGE_SECONDS=$(((INTERVAL_HOURS + 2) * 60 * 60))

if [ $((NOW - LAST_SUCCESS)) -gt "$MAX_AGE_SECONDS" ]; then
  echo "The last successful R2 backup is stale." >&2
  exit 1
fi
