import { expect, test } from "@playwright/test";
import { cleanupE2eQueueItems, e2eCustomerPrefix, loginOwner, skipWhenE2eEnvMissing } from "./helpers";

test.describe("customer walk-in to owner queue", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
    await cleanupE2eQueueItems();
  });

  test.afterEach(async () => {
    await cleanupE2eQueueItems();
  });

  test("customer can create a walk-in ticket that appears in owner queue and can be completed", async ({ page }) => {
    const customerName = `${e2eCustomerPrefix} Customer ${Date.now()}`;

    await page.goto("/walk-in");
    await page.getByLabel("ชื่อ", { exact: true }).fill(customerName);
    await page.getByLabel("เบอร์โทร").fill("0811111111");
    await page.getByLabel("หมายเหตุ").fill("customer created by Playwright");
    await page.getByRole("button", { name: "รับคิววันนี้" }).click();

    await expect(page).toHaveURL(/\/queue\/[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name: "สถานะคิว" })).toBeVisible();
    await expect(page.getByText(customerName)).toBeVisible();
    await expect(page.getByText("รหัสคิว")).toBeVisible();

    await loginOwner(page);

    const queueRow = page.locator(".bqa-owner-queue-row").filter({ hasText: customerName });
    await expect(queueRow).toBeVisible();
    await expect(queueRow).toContainText("รออยู่");

    await queueRow.getByRole("button", { name: "เริ่มตัด" }).click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);
    await expect(queueRow).toContainText("กำลังตัด");

    await queueRow.getByRole("button", { name: "เสร็จ" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "ยืนยันเสร็จ" }).click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);

    const closedRow = page.locator(".bqa-owner-closed-table tr").filter({ hasText: customerName });
    await expect(closedRow).toBeVisible();
    await expect(closedRow).toContainText("เสร็จแล้ว");
  });
});
