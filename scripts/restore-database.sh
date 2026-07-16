#!/bin/sh

set -eu

PROJECT_NAME="${1:-}"
BACKUP_FILE="${2:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"

if [ -z "$PROJECT_NAME" ] || [ -z "$BACKUP_FILE" ]; then
  echo "Usage: RESTORE_CONFIRM=restore-barber-queue scripts/restore-database.sh <compose-project-name> <backup.dump>" >&2
  exit 1
fi

if [ "${RESTORE_CONFIRM:-}" != "restore-barber-queue" ]; then
  echo "Restore blocked. Set RESTORE_CONFIRM=restore-barber-queue only after verifying the target project and taking a fresh backup." >&2
  exit 1
fi

if [ ! -s "$BACKUP_FILE" ]; then
  echo "Restore blocked: backup file is missing or empty." >&2
  exit 1
fi

cat "$BACKUP_FILE" | docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl'

echo "Restore completed. Run the production smoke checklist before reopening intake."
