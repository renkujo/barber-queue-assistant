#!/bin/sh

set -eu

require_env() {
  variable_name="$1"
  eval "variable_value=\${$variable_name:-}"

  if [ -z "$variable_value" ]; then
    echo "Backup failed: $variable_name is required." >&2
    exit 1
  fi
}

for variable_name in \
  POSTGRES_HOST \
  POSTGRES_DB \
  POSTGRES_USER \
  POSTGRES_PASSWORD \
  R2_ENDPOINT \
  R2_ACCESS_KEY_ID \
  R2_SECRET_ACCESS_KEY \
  R2_BUCKET; do
  require_env "$variable_name"
done

R2_PREFIX="${R2_PREFIX:-barber-queue-assistant/postgres}"
R2_PROVIDER="${R2_PROVIDER:-Cloudflare}"
R2_REGION="${R2_REGION:-auto}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="barber-queue-$TIMESTAMP.dump"
WORK_DIR="$(mktemp -d)"
BACKUP_FILE="$WORK_DIR/$BACKUP_NAME"
CHECKSUM_FILE="$BACKUP_FILE.sha256"
REMOTE_PATH="${R2_PREFIX#/}"
REMOTE_PATH="${REMOTE_PATH%/}"

cleanup() {
  rm -rf "$WORK_DIR"
}

trap cleanup EXIT INT TERM

echo "Starting PostgreSQL backup: database=$POSTGRES_DB timestamp=$TIMESTAMP"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  --host="$POSTGRES_HOST" \
  --username="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "Backup failed: pg_dump output is empty." >&2
  exit 1
fi

(
  cd "$WORK_DIR"
  sha256sum "$BACKUP_NAME" > "$BACKUP_NAME.sha256"
)

export RCLONE_CONFIG_R2_TYPE="s3"
export RCLONE_CONFIG_R2_PROVIDER="$R2_PROVIDER"
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="$R2_ENDPOINT"
export RCLONE_CONFIG_R2_REGION="$R2_REGION"
export RCLONE_CONFIG_R2_FORCE_PATH_STYLE="true"

rclone copyto "$BACKUP_FILE" "r2:$R2_BUCKET/$REMOTE_PATH/$BACKUP_NAME" --s3-no-check-bucket
rclone copyto "$CHECKSUM_FILE" "r2:$R2_BUCKET/$REMOTE_PATH/$BACKUP_NAME.sha256" --s3-no-check-bucket

rclone lsf "r2:$R2_BUCKET/$REMOTE_PATH" --files-only | grep -Fx "$BACKUP_NAME" >/dev/null
rclone lsf "r2:$R2_BUCKET/$REMOTE_PATH" --files-only | grep -Fx "$BACKUP_NAME.sha256" >/dev/null

touch /tmp/postgres-r2-backup-last-success
echo "Backup uploaded; remote dump and checksum objects confirmed: bucket=$R2_BUCKET object=$REMOTE_PATH/$BACKUP_NAME"
