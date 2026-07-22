import { getArgs, requireExecute, requireOperatorId, withPilotClient, writeBoundedJson } from "./pilot-script-utils.mjs";

const statuses = new Set(["CONFIRMED", "ARRIVED", "WAITING", "LATE", "IN_PROGRESS", "DONE", "CANCELLED", "NO_SHOW"]);
const reasons = new Set(["FACTUAL_STATUS_ERROR", "FACTUAL_TIME_ERROR", "FACTUAL_STATUS_AND_TIME_ERROR"]);

const main = async () => {
  const args = getArgs();
  const eventId = String(args.get("event-id") ?? "");
  const toStatus = args.get("to-status") ? String(args.get("to-status")) : null;
  const effectiveAt = args.get("effective-at") ? new Date(String(args.get("effective-at"))) : null;
  const reason = String(args.get("reason") ?? "").trim();
  if (!eventId || (!toStatus && !effectiveAt)) throw new Error("--event-id and at least one typed correction are required.");
  if (toStatus && !statuses.has(toStatus)) throw new Error("Invalid --to-status.");
  if (effectiveAt && Number.isNaN(effectiveAt.getTime())) throw new Error("Invalid --effective-at.");
  if (!reasons.has(reason)) throw new Error("--reason must use the fixed correction reason dictionary.");
  await withPilotClient("PILOT_OPERATOR_DATABASE_URL", async (client) => {
    const result = await client.query("select public.bqa_pilot_correct_event_v1($1,$2,$3,$4,$5,$6) as result", [eventId, toStatus, effectiveAt, reason, requireOperatorId(), requireExecute(args)]);
    writeBoundedJson(result.rows[0].result);
  }, args);
};

main().catch((error) => { console.error(error instanceof Error ? error.message : "Evidence correction failed."); process.exit(1); });
