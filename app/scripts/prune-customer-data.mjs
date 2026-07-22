import { getArgs, requireExecute, withPilotClient, writeBoundedJson } from "./pilot-script-utils.mjs";

const main = async () => {
  const args = getArgs();
  const retentionDays = Number(process.env.CUSTOMER_DATA_RETENTION_DAYS ?? "180");
  if (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3650) throw new Error("CUSTOMER_DATA_RETENTION_DAYS must be an integer between 30 and 3650.");
  await withPilotClient("PILOT_RETENTION_DATABASE_URL", async (client) => {
    const functionName = requireExecute(args) ? "bqa_pilot_retention_execute_v1" : "bqa_pilot_retention_preview_v1";
    const result = await client.query(`select public.${functionName}($1) as result`, [retentionDays]);
    writeBoundedJson({ ...result.rows[0].result, mode: requireExecute(args) ? "execute" : "dry-run" });
  }, args);
};

main().catch((error) => { console.error(error instanceof Error ? error.message : "Retention command failed."); process.exit(1); });
