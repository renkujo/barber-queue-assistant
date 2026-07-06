import { expect, test } from "@playwright/test";
import { cleanupE2eQueueItems, e2eCustomerPrefix, skipWhenE2eEnvMissing } from "./helpers";

test.describe("customer booking flow", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
    await cleanupE2eQueueItems();
  });

  test.afterEach(async () => {
    await cleanupE2eQueueItems();
  });

  test("customer can book a future time slot and see the tracking page", async ({ page }) => {
    const timestamp = Date.now();
    const customerName = `${e2eCustomerPrefix} Booking ${timestamp}`;
    const phone = `082${String(timestamp).slice(-7)}`;

    await page.goto("/book");
    await page.getByLabel("วัน").click();
    await page.getByRole("option", { name: "พรุ่งนี้" }).click();
    await page.getByLabel("ชื่อ", { exact: true }).fill(customerName);
    await page.getByLabel("เบอร์โทร").fill(phone);
    await page.getByLabel("หมายเหตุ").fill("booking created by Playwright");
    await page.getByRole("button", { name: "ยืนยันคิว" }).click();

    await expect(page).toHaveURL(/\/queue\/[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name: "คิวของคุณ" })).toBeVisible();
    await expect(page.getByText(customerName)).toBeVisible();
    await expect(page.getByText("ยืนยันแล้ว")).toBeVisible();
  });
});
