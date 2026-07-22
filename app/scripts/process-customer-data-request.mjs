import { getArgs, normalizeQueueCodeSuffix, requireExecute, requireOperatorId, withPilotClient, writeBoundedJson } from "./pilot-script-utils.mjs";

const main = async () => {
  const args = getArgs();
  const suffix = normalizeQueueCodeSuffix(args.get("queue-code"));
  await withPilotClient("PILOT_OPERATOR_DATABASE_URL", async (client) => {
    const result = await client.query("select public.bqa_pilot_subject_delete_v1($1,$2,$3) as result", [suffix, requireOperatorId(), requireExecute(args)]);
    writeBoundedJson(result.rows[0].result);
  }, args);
};

main().catch((error) => { console.error(error instanceof Error ? error.message : "Customer data request failed."); process.exit(1); });
