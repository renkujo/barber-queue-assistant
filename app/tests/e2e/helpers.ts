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


const getBangkokNowMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return (hour % 24) * 60 + minute;
};

export const getE2eOpenHoursAroundNow = () => {
  const nowMinutes = getBangkokNowMinutes();

  if (nowMinutes < 12 * 60) {
    return { open: "00:00", close: "12:00" };
  }

  return { open: "12:00", close: "24:00" };
};

export const setE2eShopHoursOpenNow = async () => {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const businessHours = getE2eOpenHoursAroundNow();
    await client.query(
      `update "ShopSettings" set "businessHours" = $1::jsonb, "queueIntakeEnabled" = true, "walkInEnabled" = true, "bookingEnabled" = true`,
      [JSON.stringify(businessHours)],
    );
  } finally {
    await client.end();
  }
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

const clearE2eOwnerLoginRateLimits = async () => {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`delete from "RateLimitBucket" where "key" like 'owner-login:%'`);
  } finally {
    await client.end();
  }
};

export const loginOwner = async (page: Page) => {
  await clearE2eOwnerLoginRateLimits();
  await page.goto("/owner/login");
  await page.getByLabel("รหัสเจ้าของร้าน").fill(getOwnerPasscode() ?? "");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);
};

export const promoteQueueRowToPrimary = async (page: Page, queueRow: ReturnType<Page["locator"]>) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if ((await queueRow.getByRole("button", { name: "เริ่มตัด" }).count()) > 0) {
      return;
    }

    const disclosure = queueRow.locator(".bqa-owner-reorder-disclosure");
    if (!(await disclosure.evaluate((element) => element.hasAttribute("open")))) {
      await disclosure.locator("summary").click();
    }
    const upButton = disclosure.getByRole("button", { name: /เลื่อน .* ขึ้น/ });

    if ((await upButton.count()) === 0 || !(await upButton.isEnabled())) {
      break;
    }

    await upButton.click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);
    await expect(queueRow).toBeVisible();
  }

  await expect(queueRow.getByRole("button", { name: "เริ่มตัด" })).toBeVisible();
};
