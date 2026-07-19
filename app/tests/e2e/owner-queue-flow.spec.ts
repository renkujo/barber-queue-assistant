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

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".bqa-owner-mobile-topbar")).toBeVisible();
    await expect(page.locator(".bqa-owner-mobile-bottom-nav")).toBeVisible();
    await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeHidden();
    await expect(page.locator(".bqa-owner-mobile-bottom-nav [aria-current='page']")).toContainText("วันนี้");

    await page.getByRole("button", { name: "ควบคุมร้าน" }).click();
    await expect(page.getByRole("dialog", { name: "ควบคุมร้าน" })).toBeVisible();
    await expect(page.getByRole("button", { name: "พัก 30 นาที" })).toBeVisible();
    await page.getByRole("button", { name: "ปิด", exact: true }).click();

    const mobileViewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(mobileViewport.scrollWidth).toBe(mobileViewport.clientWidth);

    await page.goto("/owner/walk-in");
    const mobileWalkInGeometry = await page.evaluate(() => {
      const submitBar = document.querySelector(".bqa-owner-walkin-submit-bar")?.getBoundingClientRect();
      const bottomNav = document.querySelector(".bqa-owner-mobile-bottom-nav")?.getBoundingClientRect();

      return {
        submitBottom: submitBar?.bottom ?? 0,
        bottomNavTop: bottomNav?.top ?? 0,
      };
    });
    expect(mobileWalkInGeometry.submitBottom).toBeLessThanOrEqual(mobileWalkInGeometry.bottomNavTop);
    expect(mobileWalkInGeometry.bottomNavTop - mobileWalkInGeometry.submitBottom).toBeLessThanOrEqual(1);

    await page.goto("/owner");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible();
    await expect(page.locator(".bqa-owner-mobile-topbar")).toBeHidden();
    await expect(page.locator(".bqa-owner-mobile-bottom-nav")).toBeHidden();
    await expect(page.locator(".bqa-owner-desktop-nav [aria-current='page']")).toContainText("คิววันนี้");
    await expect(page.getByRole("heading", { name: "คิววันนี้", level: 1 })).toBeVisible();

    const desktopViewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(desktopViewport.scrollWidth).toBe(desktopViewport.clientWidth);

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
