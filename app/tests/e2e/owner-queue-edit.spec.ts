import { expect, test } from "@playwright/test";
import { cleanupE2eQueueItems, e2eCustomerPrefix, loginOwner, skipWhenE2eEnvMissing } from "./helpers";

test.describe("owner queue edit workbench", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
    await cleanupE2eQueueItems();
  });

  test.afterEach(async () => {
    await cleanupE2eQueueItems();
  });

  test("keeps the authenticated edit fields, private note, no-lock option, and responsive layout safe", async ({ page }) => {
    const customerName = `${e2eCustomerPrefix} Edit ${Date.now()}`;
    const updatedName = `${customerName} แก้ไขชื่อยาวทดสอบภาษาไทย`;

    await loginOwner(page);
    await page.goto("/owner/walk-in");
    await page.getByLabel("ชื่อลูกค้า").fill(customerName);
    await page.getByLabel("หมายเหตุ").fill("สร้างจาก Playwright เพื่อทดสอบหน้าแก้ไข");
    await page.getByRole("button", { name: "เพิ่มเข้าคิววันนี้" }).click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);

    const queueRow = page.locator(".bqa-owner-queue-row").filter({ hasText: customerName });
    await expect(queueRow).toBeVisible();
    await queueRow.getByRole("link", { name: /แก้ไขคิว/ }).click();
    await expect(page).toHaveURL(/\/owner\/queue\/.+\/edit$/);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-queue-edit-v2")).toBeVisible();
    await expect(page.locator(".bqa-owner-mobile-bottom-nav [aria-current='page']")).toContainText("วันนี้");
    await expect(page.getByRole("heading", { name: /แก้ไขคิว/ })).toBeVisible();
    await expect(page.getByLabel("บริการ")).toBeVisible();
    await expect(page.getByLabel("วัน")).toBeVisible();
    await expect(page.getByLabel("เวลา")).toBeVisible();
    await page.getByLabel("เวลา").click();
    await expect(page.locator(".qw-v2-select-content")).toBeVisible();
    await expect(page.getByRole("option", { name: "ไม่ล็อกเวลา / walk-in" })).toBeVisible();
    await page.getByRole("option", { name: "ไม่ล็อกเวลา / walk-in" }).click();
    await expect(page.getByLabel("เวลา")).toContainText("ไม่ล็อกเวลา / walk-in");
    await expect(page.getByText("โน้ตเจ้าของร้านเป็นข้อมูลภายใน ไม่ใช่ข้อความแจ้งลูกค้า")).toBeVisible();

    await page.locator(".bqa-owner-edit-save-row .ui-button").scrollIntoViewIfNeeded();
    const mobileGeometry = await page.evaluate(() => {
      const schedule = document.querySelector(".bqa-owner-edit-section--schedule")?.getBoundingClientRect();
      const identity = document.querySelector(".bqa-owner-edit-section--identity")?.getBoundingClientRect();
      const save = document.querySelector(".bqa-owner-edit-save-row .ui-button")?.getBoundingClientRect();
      const bottomNav = document.querySelector(".bqa-owner-mobile-bottom-nav")?.getBoundingClientRect();

      return {
        scheduleTop: schedule?.top ?? 0,
        identityTop: identity?.top ?? 0,
        saveHeight: save?.height ?? 0,
        saveBottom: save?.bottom ?? 0,
        bottomNavTop: bottomNav?.top ?? Number.POSITIVE_INFINITY,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(mobileGeometry.scheduleTop).toBeLessThan(mobileGeometry.identityTop);
    expect(mobileGeometry.saveHeight).toBeGreaterThanOrEqual(48);
    expect(mobileGeometry.saveBottom).toBeLessThanOrEqual(mobileGeometry.bottomNavTop);
    expect(mobileGeometry.scrollWidth).toBe(mobileGeometry.clientWidth);

    for (const viewport of [
      { width: 768, height: 1024, rail: "below" },
      { width: 1024, height: 768, rail: "below" },
      { width: 1180, height: 900, rail: "below" },
      { width: 1399, height: 900, rail: "below" },
      { width: 1400, height: 900, rail: "right" },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const panelBox = await page.locator(".bqa-owner-edit-panel").boundingBox();
      const railBox = await page.locator(".bqa-owner-edit-rule-rail").boundingBox();

      if (viewport.rail === "right") {
        expect(railBox?.x ?? 0).toBeGreaterThan((panelBox?.x ?? 0) + (panelBox?.width ?? 0));
      } else {
        expect(railBox?.y ?? 0).toBeGreaterThanOrEqual((panelBox?.y ?? 0) + (panelBox?.height ?? 0));
      }

      const width = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(width.scroll).toBe(width.client);
    }

    await page.getByLabel("ชื่อลูกค้า").fill(updatedName);
    await page.getByLabel("เบอร์โทร").fill("");
    await page.getByLabel("หมายเหตุลูกค้า").fill("หมายเหตุลูกค้ายาวสำหรับตรวจภาษาไทยและพื้นที่ข้อความบนมือถือ");
    await page.getByLabel("โน้ตเจ้าของร้าน").fill("โน้ตส่วนตัวของร้าน ห้ามเข้าใจว่าเป็นข้อความแจ้งลูกค้า");

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible();
    await expect(page.locator(".bqa-owner-edit-rule-rail")).toBeVisible();
    await expect(page.locator(".bqa-owner-edit-rule-rail")).toContainText("เวลาเปิดร้าน");
    await expect(page.locator(".bqa-owner-edit-rule-rail")).toContainText("walk-in ไม่ต้องล็อกเวลา");

    const desktopViewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(desktopViewport.scrollWidth).toBe(desktopViewport.clientWidth);

    await Promise.all([
      page.waitForURL(/\/owner\?status=queue-updated$/, { waitUntil: "commit" }),
      page.getByRole("button", { name: "บันทึกการแก้ไข" }).click(),
    ]);
    await expect(page).toHaveURL(/\/owner(?:\?status=queue-updated)?$/);
    const updatedRow = page.locator(".bqa-owner-queue-row").filter({ hasText: updatedName });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText("โน้ต: โน้ตส่วนตัวของร้าน ห้ามเข้าใจว่าเป็นข้อความแจ้งลูกค้า");
  });
});
