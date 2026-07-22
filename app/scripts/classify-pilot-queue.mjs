import { getArgs, normalizeQueueCodeSuffix, requireExecute, requireOperatorId, withPilotClient, writeBoundedJson } from "./pilot-script-utils.mjs";

const allowed = new Set(["REAL", "TEST_SMOKE", "TRAINING", "EXCLUDED_OTHER"]);
const reasons = new Set(["SMOKE_TEST", "TRAINING_RECORD", "DATA_QUALITY", "OPERATOR_ERROR", "REVIEWED_RESTORE", "OTHER_APPROVED"]);

const main = async () => {
  const args = getArgs();
  const suffix = normalizeQueueCodeSuffix(args.get("queue-code"));
  const classification = String(args.get("classification") ?? "");
  const reason = String(args.get("reason") ?? "").trim();
  const reviewedRestore = args.get("reviewed-restore") === true;
  if (!allowed.has(classification)) throw new Error("Invalid --classification.");
  if (!reasons.has(reason)) throw new Error("--reason must use the fixed classification reason dictionary.");
  if (classification === "REAL" && (!reviewedRestore || reason !== "REVIEWED_RESTORE")) throw new Error("Restoring REAL requires --reviewed-restore and REVIEWED_RESTORE reason.");
  await withPilotClient("PILOT_OPERATOR_DATABASE_URL", async (client) => {
    const result = await client.query("select public.bqa_pilot_classify_queue_v1($1,$2,$3,$4,$5,$6) as result", [suffix, classification, reason, requireOperatorId(), reviewedRestore, requireExecute(args)]);
    writeBoundedJson(result.rows[0].result);
  }, args);
};

main().catch((error) => { console.error(error instanceof Error ? error.message : "Pilot classification failed."); process.exit(1); });
