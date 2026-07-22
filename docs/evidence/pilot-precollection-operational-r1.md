# Pilot Pre-Collection Operational Validation R1

Date: 2026-07-22
Authorization: human-approved pre-collection operational validation
Measurement state: **disabled throughout**

This receipt covers only synthetic/local operational validation. It does not authorize or claim production deployment, real credentials, real backup access, external Daily Close storage, data collection, customer invitation, pilot execution, pricing, commit, or push.

## Deployment reality

- Current branch: `main`; implementation remains uncommitted.
- Deployment target documented by the repository: Haabiz/Dokploy Compose.
- Compose services parse as `postgres`, `web`, and disabled-by-default `backup`.
- Pilot measurement remains disabled by default in Compose.
- Web/PostgreSQL use internal `expose` only; no host ports are published.
- Backup remains disabled by default.
- Docker CLI `29.4.0` is present, but no local Docker server/container runtime was available during this validation. No container or real deployment was started.

## Synthetic backup and restore proof

Command:

```bash
scripts/verify-pilot-backup-restore.sh
```

Result:

```text
pilot_backup_restore=PASS
checksum=PASS
no_owner_acl_restore=PASS
function_owner_reconcile=PASS
retention_replay=PASS
cleanup=PASS
```

The proof creates two disposable PostgreSQL databases, applies all current migrations, writes synthetic expired evidence, produces a custom-format dump plus checksum, restores with `--no-owner --no-acl`, reapplies migration state, reconciles the non-login security-definer owner and privileges, runs current retention, verifies expired evidence removal, then destroys both databases and artifacts.

Important finding: portable `--no-owner --no-acl` restore does not preserve the `bqa_pilot_function_owner` ownership/grants needed by the bounded procedures. `app/scripts/reconcile-pilot-function-owner.sql` is now mandatory after restore and before role provisioning or retention. The runbook, R2 guide, restore command, and deployment checklist were updated accordingly.

## Backup/restore guard hardening

- `scripts/backup-database.sh` now uses `umask 077` and writes a portable basename checksum.
- `scripts/restore-database.sh` now requires:
  - matching `.sha256` sidecar and successful checksum verification;
  - exact `RESTORE_TARGET_PROJECT_CONFIRM`;
  - `RESTORE_ISOLATED_CONFIRM=isolated-disposable`;
  - `RESTORE_OUTBOUND_DISABLED_CONFIRM=no-public-or-notifications`;
  - custom-format archive validation before destructive restore.
- Restore output now requires migration, function-owner reconciliation, bounded-role provisioning, retention, subject reconciliation, postconditions, and destruction before any smoke.

## Bounded-role lifecycle proof

An isolated database with synthetic temporary passwords passed:

- provision: PASS
- exact grant verification: PASS
- reporter/operator/retention direct table mutation/read denial: PASS
- reporter temporary object denial: PASS
- password rotation through re-provision: PASS
- emergency `NOLOGIN` + execute revoke + session termination: PASS
- re-provision after emergency disable: PASS
- disposable databases removed: PASS
- temporary global login roles returned to `NOLOGIN`: PASS

New operational SQL:

- `app/scripts/verify-pilot-role-grants.sql`
- `app/scripts/disable-pilot-roles.sql`
- `app/scripts/reconcile-pilot-function-owner.sql`

## Still blocked before collection

- commit/push and Haabiz/Dokploy deployment with measurement disabled;
- actual production-domain smoke and 503 uptime alert;
- real production role provisioning, rotation, disable/re-provision, and bounded receipt;
- authorization for any filled Daily Close record; the empty encrypted location is approved and validated;
- real R2 credentials, first dump/checksum, 14-day lifecycle evidence, and health alert;
- real manual backup deletion within 7 days;
- isolated restore of one real backup pair followed by the now-proven reconciliation sequence;
- real privacy contact and shop-owner operational review;
- human pre-collection PASS;
- separate measurement enablement and pilot-execution approvals.

No later gate is implied by this synthetic operational PASS.

## Daily Close empty storage

Kiattisak approved the recommended local encrypted location. The empty APFS/AES-256 container was created outside git/cloud sync, restricted to owner-only permissions, excluded from Time Machine, and its key stored in macOS Keychain. The header-only CSV validated with `0` data rows and the container was unmounted. See [`../operations/pilot-daily-close-storage-proposal-r1.md`](../operations/pilot-daily-close-storage-proposal-r1.md). This does not authorize a filled record.
