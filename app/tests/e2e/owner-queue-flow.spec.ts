import { expect, test } from "@playwright/test";
import { cleanupE2eQueueItems, e2eCustomerPrefix, loginOwner, promoteQueueRowToPrimary, skipWhenE2eEnvMissing } from "./helpers";

test.describe("owner queue flow", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
    await cleanupE2eQueueItems();
  });

  test.afterEach(async () => {
    await cleanupE2eQueueItems();
  });

  test("owner can add, share, complete, and restore a phone-less walk-in queue item", async ({ context, page }) => {
    const customerName = `${e2eCustomerPrefix} Owner ${Date.now()}`;
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await loginOwner(page);

    await page.goto("/owner/walk-in");
    await page.getByLabel("ชื่อลูกค้า").fill(customerName);
    await page.getByLabel("หมายเหตุ").fill("created by Playwright");
    await page.getByRole("button", { name: "เพิ่มเข้าคิววันนี้" }).click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);

    const queueRow = page.locator(".bqa-owner-queue-row").filter({ hasText: customerName });
    await expect(queueRow).toBeVisible();
    await expect(queueRow.getByText(/^PIN \d{4}$/)).toBeVisible();
    await queueRow.getByRole("button", { name: "คัดลอกคิว" }).click();
    await expect(queueRow.getByRole("button", { name: "คัดลอกแล้ว" })).toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/PIN เช็คคิว \d{4}/);
    expect(clipboardText).toMatch(/\/queue\/[a-f0-9-]{36}$/);

    await promoteQueueRowToPrimary(page, queueRow);

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
