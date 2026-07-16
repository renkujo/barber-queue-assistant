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

    await page.goto("/book");
    await page.getByLabel("วัน").click();
    await page.getByRole("option", { name: "พรุ่งนี้" }).click();
    await page.getByLabel("ชื่อ", { exact: true }).fill(customerName);
    await expect(page.getByLabel("เบอร์โทร (ไม่บังคับ)")).toBeVisible();
    await page.getByLabel("หมายเหตุ").fill("booking created by Playwright");
    await page.getByRole("button", { name: "ยืนยันคิว" }).click();

    await expect(page).toHaveURL(/\/queue\/[a-f0-9-]{36}$/);
    await expect(page.getByRole("heading", { name: "คิวของคุณ" })).toBeVisible();
    await expect(page.getByText(`${Array.from(customerName).slice(0, 2).join("")}***`)).toBeVisible();
    await expect(page.getByText("ยืนยันแล้ว")).toBeVisible();

    const trackingUrl = page.url();
    const queueCode = await page.locator(".bqa-tracking-ticket strong").innerText();
    const accessPin = await page.locator(".bqa-tracking-access-pin").innerText();

    expect(accessPin).toMatch(/^\d{4}$/);

    await page.goto("/");
    await page.getByLabel("รหัสคิว").fill(queueCode);
    await page.getByLabel("PIN เช็คคิว 4 ตัว").fill(accessPin);
    await page.getByRole("button", { name: "เช็คสถานะคิว" }).click();
    await expect(page).toHaveURL(trackingUrl);
  });
});
