import { expect, type Page, test } from "@playwright/test";
import { Client } from "pg";

process.loadEnvFile?.(".env");

export const e2eCustomerPrefix = "PW-E2E";

export const getDatabaseUrl = () => process.env.DATABASE_URL;
export const getOwnerPasscode = () => process.env.BARBER_ADMIN_PASSCODE;

export const skipWhenE2eEnvMissing = () => {
  test.skip(!getDatabaseUrl(), "DATABASE_URL is required for e2e tests.");
  test.skip(!getOwnerPasscode(), "BARBER_ADMIN_PASSCODE is required for e2e tests.");
};

export const cleanupE2eQueueItems = async () => {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    const queueItems = await client.query<{ id: string; customerId: string | null }>(
      `select "id", "customerId" from "QueueItem" where "customerNameSnapshot" like $1`,
      [`${e2eCustomerPrefix}%`],
    );
    const queueItemIds = queueItems.rows.map((item) => item.id);
    const customerIds = queueItems.rows.map((item) => item.customerId).filter((id): id is string => Boolean(id));

    if (queueItemIds.length) {
      await client.query(`delete from "NotificationLog" where "queueItemId" = any($1::text[])`, [queueItemIds]);
      await client.query(`delete from "QueueItem" where "id" = any($1::text[])`, [queueItemIds]);
    }

    if (customerIds.length) {
      await client.query(
        `delete from "Customer" where "id" = any($1::text[]) and not exists (select 1 from "QueueItem" where "QueueItem"."customerId" = "Customer"."id")`,
        [customerIds],
      );
    }

    await client.query(
      `delete from "Customer" where "name" like $1 and not exists (select 1 from "QueueItem" where "QueueItem"."customerId" = "Customer"."id")`,
      [`${e2eCustomerPrefix}%`],
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
};

export const loginOwner = async (page: Page) => {
  await page.goto("/owner/login");
  await page.getByLabel("รหัสเจ้าของร้าน").fill(getOwnerPasscode() ?? "");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);
};
