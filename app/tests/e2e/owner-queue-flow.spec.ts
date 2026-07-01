import { expect, test } from "@playwright/test";
import { cleanupE2eQueueItems, e2eCustomerPrefix, loginOwner, skipWhenE2eEnvMissing } from "./helpers";

test.describe("owner queue flow", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
    await cleanupE2eQueueItems();
  });

  test.afterEach(async () => {
    await cleanupE2eQueueItems();
  });

  test("owner can add, complete, and restore a walk-in queue item", async ({ page }) => {
    const customerName = `${e2eCustomerPrefix} Owner ${Date.now()}`;

    await loginOwner(page);

    await page.goto("/owner/walk-in");
    await page.getByLabel("ชื่อลูกค้า").fill(customerName);
    await page.getByLabel("เบอร์โทร").fill("0800000000");
    await page.getByLabel("หมายเหตุ").fill("created by Playwright");
    await page.getByRole("button", { name: "เพิ่มเข้าคิววันนี้" }).click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);

    const queueRow = page.locator(".bqa-owner-queue-row").filter({ hasText: customerName });
    await expect(queueRow).toBeVisible();

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

    await closedRow.getByRole("button", { name: "เปิดกลับ" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "เปิดคิวกลับ" }).click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);

    const restoredRow = page.locator(".bqa-owner-queue-row").filter({ hasText: customerName });
    await expect(restoredRow).toBeVisible();
    await expect(restoredRow).toContainText("รออยู่");
  });
});
