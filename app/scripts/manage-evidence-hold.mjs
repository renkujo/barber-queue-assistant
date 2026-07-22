import { getArgs, normalizeQueueCodeSuffix, requireExecute, requireOperatorId, withPilotClient, writeBoundedJson } from "./pilot-script-utils.mjs";

const reasons = new Set(["INCIDENT", "CUSTOMER_DISPUTE", "LEGAL"]);

const main = async () => {
  const args = getArgs();
  const suffix = normalizeQueueCodeSuffix(args.get("queue-code"));
  const action = args.get("release") === true ? "release" : "create";
  const reason = action === "create" ? String(args.get("reason") ?? "") : null;
  const days = action === "create" ? Number(args.get("days") ?? 30) : null;
  if (action === "create" && (!reasons.has(reason) || !Number.isInteger(days) || days < 1 || days > 30)) throw new Error("Create requires a fixed --reason and --days 1..30.");
  await withPilotClient("PILOT_OPERATOR_DATABASE_URL", async (client) => {
    const result = await client.query("select public.bqa_pilot_manage_hold_v1($1,$2,$3,$4,$5,$6) as result", [suffix, action, reason, days, requireOperatorId(), requireExecute(args)]);
    writeBoundedJson(result.rows[0].result);
  }, args);
};

main().catch((error) => { console.error(error instanceof Error ? error.message : "Evidence hold command failed."); process.exit(1); });
