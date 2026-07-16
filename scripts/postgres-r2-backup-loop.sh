#!/bin/sh

set -u

if [ "${R2_BACKUP_ENABLED:-false}" != "true" ]; then
  echo "R2 backup sidecar is disabled. Set R2_BACKUP_ENABLED=true after configuring and testing the R2 credentials."
  exec tail -f /dev/null
fi

INTERVAL_HOURS="${R2_BACKUP_INTERVAL_HOURS:-24}"
RETRY_MINUTES="${R2_BACKUP_RETRY_MINUTES:-15}"
MAX_ATTEMPTS="${R2_BACKUP_MAX_ATTEMPTS:-3}"

for numeric_value in "$INTERVAL_HOURS" "$RETRY_MINUTES" "$MAX_ATTEMPTS"; do
  case "$numeric_value" in
    ''|*[!0-9]*)
      echo "Backup interval and retry values must be positive integers." >&2
      exit 1
      ;;
  esac
done

if [ "$INTERVAL_HOURS" -lt 1 ] || [ "$RETRY_MINUTES" -lt 1 ] || [ "$MAX_ATTEMPTS" -lt 1 ]; then
  echo "Backup interval and retry values must be at least 1." >&2
  exit 1
fi

INTERVAL_SECONDS=$((INTERVAL_HOURS * 60 * 60))
RETRY_SECONDS=$((RETRY_MINUTES * 60))

run_backup() {
  if /usr/local/bin/postgres-r2-backup; then
    return 0
  fi

  echo "Backup attempt failed." >&2
  return 1
}

run_backup_with_retries() {
  attempt=1

  while ! run_backup; do
    if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
      echo "Backup failed after $MAX_ATTEMPTS attempt(s); the sidecar will retry at the next regular interval." >&2
      return 1
    fi

    attempt=$((attempt + 1))
    echo "Retrying backup in $RETRY_MINUTES minute(s), attempt $attempt of $MAX_ATTEMPTS." >&2
    sleep "$RETRY_SECONDS"
  done
}

run_backup_with_retries || true

while true; do
  sleep "$INTERVAL_SECONDS"
  run_backup_with_retries || true
done
