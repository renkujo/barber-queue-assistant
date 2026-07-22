#!/bin/sh

set -eu
umask 077

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR/app"
APP_ROLE="$(id -un)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)-$$"
SOURCE_DB="bqa_restore_source_$STAMP"
TARGET_DB="bqa_restore_target_$STAMP"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/bqa-restore-proof.XXXXXX")"
DUMP_FILE="$WORK_DIR/pilot-restore-proof.dump"

cleanup() {
  dropdb --if-exists --force "$SOURCE_DB" >/dev/null 2>&1 || true
  dropdb --if-exists --force "$TARGET_DB" >/dev/null 2>&1 || true
  rm -rf "$WORK_DIR"
}

trap cleanup EXIT INT TERM

for command_name in createdb dropdb pg_dump pg_restore psql shasum pnpm; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "Restore proof requires $command_name." >&2
    exit 1
  }
done

createdb "$SOURCE_DB"
(cd "$APP_DIR" && DATABASE_URL="postgresql://$APP_ROLE@localhost:5432/$SOURCE_DB" pnpm prisma migrate deploy) >/dev/null

psql -d "$SOURCE_DB" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
INSERT INTO public."PilotCohort"("id","evidenceExpiresAt","createdAt")
VALUES ('restore-proof-expired','2020-01-01T00:00:00Z',now());

INSERT INTO public."QueueItem"(
  "id","publicToken","type","status","customerNameSnapshot","serviceNameSnapshot",
  "serviceDurationMinutes","date","createdBy","pilotClassification","pilotCohortId",
  "pilotReleaseSegment","createdAt","updatedAt"
) VALUES (
  'restore-proof-queue','restore-proof-token','WALK_IN','WAITING','Restore Proof Customer',
  'Restore Proof Service',30,now(),'OWNER','REAL','restore-proof-expired','restore-proof-r1',now(),now()
);

INSERT INTO public."QueueMutationOperation"(
  "id","mutationSource","primaryQueueItemId","outcome","pilotCohortId",
  "pilotReleaseSegment","createdAt","completedAt"
) VALUES (
  '00000000-0000-4000-8000-000000000001','OWNER_STATUS_ACTION','restore-proof-queue',
  'APPLIED','restore-proof-expired','restore-proof-r1',now(),now()
);

INSERT INTO public."QueueEvent"(
  "id","operationId","role","eventOrdinal","queueItemId","type","actor","mutationSource",
  "reason","schemaVersion","sequence","effectiveAt","recordedAt","pilotCohortId",
  "pilotReleaseSegment","fromStatus","toStatus"
) VALUES (
  'restore-proof-event','00000000-0000-4000-8000-000000000001','PRIMARY',0,
  'restore-proof-queue','STATUS_CHANGED','OWNER','OWNER_STATUS_ACTION','OWNER_REQUEST',1,1,
  now(),now(),'restore-proof-expired','restore-proof-r1','CONFIRMED','WAITING'
);
SQL

pg_dump -d "$SOURCE_DB" --format=custom --no-owner --no-acl --file="$DUMP_FILE"
(cd "$WORK_DIR" && shasum -a 256 "$(basename "$DUMP_FILE")" > "$(basename "$DUMP_FILE").sha256")
(cd "$WORK_DIR" && shasum -a 256 -c "$(basename "$DUMP_FILE").sha256") >/dev/null
pg_restore --list "$DUMP_FILE" >/dev/null

createdb "$TARGET_DB"
pg_restore -d "$TARGET_DB" --no-owner --no-acl "$DUMP_FILE"
(cd "$APP_DIR" && DATABASE_URL="postgresql://$APP_ROLE@localhost:5432/$TARGET_DB" pnpm prisma migrate deploy) >/dev/null

psql -d "$TARGET_DB" -v ON_ERROR_STOP=1 \
  -v expected_database="$TARGET_DB" \
  -v app_role="$APP_ROLE" \
  -f "$APP_DIR/scripts/reconcile-pilot-function-owner.sql" >/dev/null

psql -d "$TARGET_DB" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
BEGIN;
SET LOCAL ROLE bqa_pilot_function_owner;
SELECT public.bqa_pilot_retention_execute_v1(180);
COMMIT;

DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM public."QueueEvent" WHERE "id" = 'restore-proof-event') THEN
    RAISE EXCEPTION 'Expired event survived restored retention';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public."QueueItem"
    WHERE "id" = 'restore-proof-queue' AND "pilotCohortId" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Expired queue pilot linkage survived restored retention';
  END IF;
END
$block$;
SQL

echo "pilot_backup_restore=PASS checksum=PASS no_owner_acl_restore=PASS function_owner_reconcile=PASS retention_replay=PASS cleanup=scheduled"
