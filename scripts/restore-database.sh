#!/bin/sh

set -eu
umask 077

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

if [ "${RESTORE_TARGET_PROJECT_CONFIRM:-}" != "$PROJECT_NAME" ]; then
  echo "Restore blocked. Set RESTORE_TARGET_PROJECT_CONFIRM to the exact disposable Compose project name." >&2
  exit 1
fi

if [ "${RESTORE_ISOLATED_CONFIRM:-}" != "isolated-disposable" ]; then
  echo "Restore blocked. Set RESTORE_ISOLATED_CONFIRM=isolated-disposable after confirming the target has no production route or write path." >&2
  exit 1
fi

if [ "${RESTORE_OUTBOUND_DISABLED_CONFIRM:-}" != "no-public-or-notifications" ]; then
  echo "Restore blocked. Set RESTORE_OUTBOUND_DISABLED_CONFIRM=no-public-or-notifications after removing public routing and notification credentials." >&2
  exit 1
fi

if [ ! -s "$BACKUP_FILE" ]; then
  echo "Restore blocked: backup file is missing or empty." >&2
  exit 1
fi

CHECKSUM_FILE="$BACKUP_FILE.sha256"

if [ ! -s "$CHECKSUM_FILE" ]; then
  echo "Restore blocked: checksum sidecar is missing or empty." >&2
  exit 1
fi

BACKUP_DIR="$(CDPATH= cd -- "$(dirname -- "$BACKUP_FILE")" && pwd)"
BACKUP_NAME="$(basename "$BACKUP_FILE")"
CHECKSUM_NAME="$(basename "$CHECKSUM_FILE")"

if command -v shasum >/dev/null 2>&1; then
  (cd "$BACKUP_DIR" && shasum -a 256 -c "$CHECKSUM_NAME") >/dev/null
else
  (cd "$BACKUP_DIR" && sha256sum -c "$CHECKSUM_NAME") >/dev/null
fi

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore --list >/dev/null < "$BACKUP_FILE"

cat "$BACKUP_FILE" | docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl'

echo "Restore completed into the confirmed isolated project. Before any smoke: apply current migrations, run reconcile-pilot-function-owner.sql, provision bounded roles, run retention and subject reconciliation, verify postconditions, then destroy the project. Never promote this database to production."
