import { getArgs, requireExecute, withPilotClient, writeBoundedJson } from "./pilot-script-utils.mjs";

const idPattern = /^[a-z0-9][a-z0-9-]{0,47}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const main = async () => {
  const args = getArgs();
  const id = String(args.get("id") ?? "");
  const pilotEnd = String(args.get("pilot-end") ?? "");
  const timezone = String(args.get("shop-timezone") ?? "");
  const approvalRef = String(args.get("approval-ref") ?? "");
  if (!idPattern.test(id) || !datePattern.test(pilotEnd) || !timezone || !approvalRef) {
    throw new Error("--id, --pilot-end YYYY-MM-DD, --shop-timezone, and --approval-ref are required.");
  }
  await withPilotClient("PILOT_OPERATOR_DATABASE_URL", async (client) => {
    const result = await client.query("select public.bqa_pilot_create_cohort_v1($1,$2::date,$3,$4,$5) as result", [id, pilotEnd, timezone, approvalRef, requireExecute(args)]);
    writeBoundedJson(result.rows[0].result);
  }, args);
};

main().catch((error) => { console.error(error instanceof Error ? error.message : "Pilot cohort command failed."); process.exit(1); });
