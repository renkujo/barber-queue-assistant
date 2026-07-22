import { getArgs, withPilotClient, writeBoundedJson } from "./pilot-script-utils.mjs";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const idPattern = /^[a-z0-9][a-z0-9-]{0,47}$/;

const main = async () => {
  const args = getArgs();
  const from = String(args.get("from") ?? "");
  const to = String(args.get("to") ?? "");
  const cohort = String(args.get("cohort") ?? "");
  if (!datePattern.test(from) || !datePattern.test(to) || !idPattern.test(cohort)) throw new Error("--from, --to, and --cohort are required.");
  await withPilotClient("PILOT_REPORT_DATABASE_URL", async (client) => {
    const result = await client.query("select public.bqa_pilot_report_v1($1::date,$2::date,$3) as result", [from, to, cohort]);
    writeBoundedJson(result.rows[0].result);
  }, args);
};

main().catch((error) => { console.error(error instanceof Error ? error.message : "Pilot report failed."); process.exit(1); });
