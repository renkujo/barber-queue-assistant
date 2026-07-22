import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(join(root, "prisma/migrations/20260722140000_harden_pilot_operations/migration.sql"), "utf8");
const maintenanceOwnerMigration = readFileSync(join(root, "prisma/migrations/20260722144000_fix_event_maintenance_identity/migration.sql"), "utf8");
const grants = readFileSync(join(root, "scripts/provision-pilot-roles.sql"), "utf8");
const grantVerification = readFileSync(join(root, "scripts/verify-pilot-role-grants.sql"), "utf8");
const roleDisablement = readFileSync(join(root, "scripts/disable-pilot-roles.sql"), "utf8");
const restoreReconciliation = readFileSync(join(root, "scripts/reconcile-pilot-function-owner.sql"), "utf8");
const restoreScript = readFileSync(join(root, "../scripts/restore-database.sh"), "utf8");
const restoreProof = readFileSync(join(root, "../scripts/verify-pilot-backup-restore.sh"), "utf8");
const utils = readFileSync(join(root, "scripts/pilot-script-utils.mjs"), "utf8");
const tempFiles: string[] = [];
afterEach(() => tempFiles.splice(0).forEach((file) => unlinkSync(file)));

describe("pilot database security contract", () => {
  it("uses a non-login owner, fixed search paths, revoked PUBLIC execute, and execute-only login grants", () => {
    expect(migration).toContain("bqa_pilot_function_owner NOLOGIN");
    expect(migration.match(/SECURITY DEFINER/g)?.length).toBeGreaterThanOrEqual(8);
    expect(migration.match(/SET search_path = pg_catalog/g)?.length).toBeGreaterThanOrEqual(10);
    expect(migration.match(/REVOKE ALL ON FUNCTION/g)?.length).toBeGreaterThanOrEqual(10);
    expect(grants).not.toMatch(/GRANT\s+(SELECT|INSERT|UPDATE|DELETE)/i);
    expect(grants).toContain("REVOKE ALL ON ALL TABLES");
    expect(grants).toContain("GRANT USAGE ON SCHEMA public TO :\"app_role\"");
    expect(grants.match(/GRANT EXECUTE ON FUNCTION/g)?.length).toBe(8);
    expect(grants.match(/ALTER ROLE bqa_pilot_(reporter|operator|retention) LOGIN/g)?.length).toBe(3);
    expect(grantVerification).toContain("direct relation privileges");
    expect(roleDisablement.match(/ALTER ROLE bqa_pilot_(reporter|operator|retention) NOLOGIN/g)?.length).toBe(3);
  });

  it("enforces append-only corrections and same-queue/cohort locking", () => {
    expect(migration).toContain("QueueEvent is append-only");
    expect(migration).toContain("Correction must remain in the same queue and cohort");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(maintenanceOwnerMigration).toContain("CURRENT_USER <> 'bqa_pilot_function_owner'");
    expect(maintenanceOwnerMigration).toContain("current_setting('bqa.pilot_maintenance', true)");
  });
});

describe("pilot retention, deletion, and report contracts", () => {
  it("protects active held evidence while pruning eligible rows within shared operations", () => {
    expect(migration).toContain('DELETE FROM public."QueueEvent" e USING public."PilotCohort" c');
    expect(migration).toContain('NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=e."queueItemId"');
    expect(migration).toContain('NOT EXISTS(SELECT 1 FROM public."QueueEvent" e WHERE e."operationId"=o."id")');
    expect(migration).toContain("Retention post-condition failed for eligible expired events");
  });

  it("reconstructs function ownership after a portable restore before re-pruning", () => {
    expect(restoreReconciliation).toContain("ALTER FUNCTION public.bqa_pilot_retention_execute_v1(integer) OWNER TO bqa_pilot_function_owner");
    expect(restoreReconciliation).toContain("Pilot function-owner reconciliation failed");
    expect(restoreScript).toContain("RESTORE_TARGET_PROJECT_CONFIRM");
    expect(restoreScript).toContain("RESTORE_ISOLATED_CONFIRM");
    expect(restoreScript).toContain("RESTORE_OUTBOUND_DISABLED_CONFIRM");
    expect(restoreScript).toContain("shasum -a 256 -c");
    expect(restoreProof).toContain("bqa_pilot_retention_execute_v1(180)");
  });

  it("deletes every queue linked to a verified subject in one locked transaction boundary", () => {
    expect(migration).toContain('customer_id IS NOT NULL AND "customerId"=customer_id');
    expect(migration).toContain('WHERE "id"=ANY(queue_ids) ORDER BY "id" FOR UPDATE');
    expect(migration).toContain('"queueItemId"=ANY(queue_ids)');
    expect(migration).toContain("Deletion is deferred by an active approved hold");
  });

  it("reports approved denominators, classifications, correction truth, and customer-only notification truth", () => {
    expect(migration).toContain("booking_terminal");
    expect(migration).toContain("walk_invalid");
    expect(migration).toContain("duration_invalid");
    expect(migration).toContain("classifications");
    expect(migration).toContain('"audience"=\'CUSTOMER\'');
    expect(migration).toContain("terminal_business_events");
    expect(migration).toContain("correctsEventId");
    expect(migration).toContain("'shareSafe',false");
  });
});

describe("pilot operator script validation", () => {
  it("requires process-only credentials, exact parsed identity, production confirmation, and private/TLS execution", () => {
    expect(utils).not.toContain("readFile");
    expect(utils).toContain("app .env fallback is forbidden");
    expect(utils).toContain("identity.role !== expectedRole");
    expect(utils).toContain("actual?.database !== connection.expectedDatabase");
    expect(utils).toContain("PILOT_EXPECTED_DATABASE");
    expect(utils).toContain("PILOT_EXPECTED_HOST");
    expect(utils).toContain('sslMode !== "verify-full"');
    expect(utils).toContain('args.get("confirm-production") !== true');
    expect(utils).toContain("Refusing output larger than 64 KiB");
  });

  it("validates the empty Daily Close template and rejects an invalid record", () => {
    expect(execFileSync("node", ["scripts/validate-pilot-daily-close.mjs"], { cwd: root, encoding: "utf8" })).toContain("Daily Close r1 valid: 0 data row(s)");
    const template = readFileSync(join(root, "../docs/templates/pilot-daily-close-r1.csv"), "utf8").trim();
    const invalid = join(root, ".pilot-daily-close-invalid.csv");
    tempFiles.push(invalid);
    writeFileSync(invalid, `${template}\n2026-01-01,,,,maybe${",".repeat(24)}\n`);
    expect(() => execFileSync("node", ["scripts/validate-pilot-daily-close.mjs", invalid], { cwd: root, stdio: "pipe" })).toThrow();
  });
});
