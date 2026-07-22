#!/bin/sh

set -eu
umask 077

PROJECT_NAME="${1:-${COMPOSE_PROJECT_NAME:-}}"
OUTPUT_DIR="${2:-./backups}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"

if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: scripts/backup-database.sh <compose-project-name> [output-directory]" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$OUTPUT_DIR/barber-queue-$TIMESTAMP.dump"

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' \
  > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  rm -f "$BACKUP_FILE"
  echo "Backup failed: output file is empty." >&2
  exit 1
fi

BACKUP_NAME="$(basename "$BACKUP_FILE")"

if command -v shasum >/dev/null 2>&1; then
  (cd "$OUTPUT_DIR" && shasum -a 256 "$BACKUP_NAME" > "$BACKUP_NAME.sha256")
else
  (cd "$OUTPUT_DIR" && sha256sum "$BACKUP_NAME" > "$BACKUP_NAME.sha256")
fi

echo "Backup written: $BACKUP_FILE"
echo "Checksum written: $BACKUP_FILE.sha256"
