import { readFile } from "node:fs/promises";
import pg from "pg";

const parseEnvFile = async () => {
  const env = {};
  const content = await readFile(new URL("../.env", import.meta.url), "utf8").catch(() => "");

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");

    if (index === -1) continue;

    env[line.slice(0, index)] = line.slice(index + 1).replace(/^"|"$/g, "");
  }

  return env;
};

const main = async () => {
  const env = await parseEnvFile();
  const connectionString = process.env.DATABASE_URL ?? env.DATABASE_URL;
  const retentionDays = Number(process.env.CUSTOMER_DATA_RETENTION_DAYS ?? env.CUSTOMER_DATA_RETENTION_DAYS ?? "180");
  const execute = process.argv.includes("--execute");

  if (!connectionString) throw new Error("DATABASE_URL is required.");
  if (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3650) {
    throw new Error("CUSTOMER_DATA_RETENTION_DAYS must be an integer between 30 and 3650.");
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const cutoffResult = await client.query("select now() - ($1::text || ' days')::interval as cutoff", [retentionDays]);
    const cutoff = cutoffResult.rows[0].cutoff;
    const counts = await client.query(
      `select
        (select count(*)::int from "QueueItem" where "date" < $1) as "queueItems",
        (select count(*)::int from "NotificationLog" where "createdAt" < $1) as "notificationLogs",
        (select count(*)::int from "Customer" c where c."updatedAt" < $1 and not exists (
          select 1 from "QueueItem" q where q."customerId" = c."id" and q."date" >= $1
        )) as "customersEligibleAfterAnonymization"`,
      [cutoff],
    );

    console.table({ retentionDays, cutoff, ...counts.rows[0], mode: execute ? "execute" : "dry-run" });

    if (!execute) {
      console.log("Dry run only. Re-run with --execute after reviewing the counts and confirming a fresh backup exists.");
      return;
    }

    await client.query("begin");
    await client.query(
      `update "NotificationLog"
       set "customerId" = null,
           "recipient" = null,
           "messagePreview" = 'ลบรายละเอียดตามนโยบายการเก็บข้อมูล',
           "error" = null
       where "createdAt" < $1`,
      [cutoff],
    );
    await client.query(
      `update "QueueItem"
       set "customerId" = null,
           "customerNameSnapshot" = 'ลบข้อมูลแล้ว',
           "phoneSnapshot" = null,
           "lineUserIdSnapshot" = null,
           "note" = null,
           "ownerNote" = null
       where "date" < $1`,
      [cutoff],
    );
    const deletedCustomers = await client.query(
      `delete from "Customer" c
       where c."updatedAt" < $1
         and not exists (select 1 from "QueueItem" q where q."customerId" = c."id")
         and not exists (select 1 from "NotificationLog" n where n."customerId" = c."id")
       returning c."id"`,
      [cutoff],
    );
    await client.query(
      `delete from "RateLimitBucket"
       where "updatedAt" < now() - interval '30 days'`,
    );
    await client.query("commit");

    console.log(`Retention cleanup completed. Deleted ${deletedCustomers.rowCount ?? 0} orphaned customer records.`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
