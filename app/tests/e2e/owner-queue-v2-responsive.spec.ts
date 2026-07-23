import { expect, test } from "@playwright/test";
import { cleanupE2eQueueItems, e2eCustomerPrefix, loginOwner, skipWhenE2eEnvMissing } from "./helpers";

const expectNoHorizontalOverflow = async (page: Parameters<typeof loginOwner>[0]) => {
  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(viewport.scrollWidth).toBe(viewport.clientWidth);
};

test.describe("owner queue V2 responsive ownership", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
    await cleanupE2eQueueItems();
  });

  test.afterEach(async () => {
    await cleanupE2eQueueItems();
  });

  test("keeps shell and rail ownership stable across V2 boundaries", async ({ page }) => {
    await loginOwner(page);

    for (const viewport of [
      { width: 360, height: 800, sidebar: false, bottomNav: true, sideRail: false, statusStrip: true },
      { width: 390, height: 844, sidebar: false, bottomNav: true, sideRail: false, statusStrip: true },
      { width: 768, height: 1024, sidebar: false, bottomNav: true, sideRail: false, statusStrip: true },
      { width: 1024, height: 768, sidebar: true, bottomNav: false, sideRail: false, statusStrip: true },
      { width: 1180, height: 900, sidebar: true, bottomNav: false, sideRail: false, statusStrip: true },
      { width: 1359, height: 900, sidebar: true, bottomNav: false, sideRail: false, statusStrip: true },
      { width: 1360, height: 900, sidebar: true, bottomNav: false, sideRail: true, statusStrip: false },
      { width: 1399, height: 900, sidebar: true, bottomNav: false, sideRail: true, statusStrip: false },
      { width: 1400, height: 900, sidebar: true, bottomNav: false, sideRail: true, statusStrip: false },
      { width: 1440, height: 1000, sidebar: true, bottomNav: false, sideRail: true, statusStrip: false },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/owner");

      await expect(page.locator("main[data-owner-visual='v2']")).toBeVisible();
      await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible({ visible: viewport.sidebar });
      await expect(page.locator(".bqa-owner-mobile-bottom-nav")).toBeVisible({ visible: viewport.bottomNav });
      await expect(page.locator(".bqa-owner-side-rail")).toBeVisible({ visible: viewport.sideRail });
      await expect(page.locator(".bqa-owner-status-strip")).toBeVisible({ visible: viewport.statusStrip });
      await expectNoHorizontalOverflow(page);
    }
  });

  test("keeps queue actions inside the board and clear of mobile navigation", async ({ page }) => {
    const customerName = `${e2eCustomerPrefix} ลูกค้าชื่อยาวมากเพื่อทดสอบการตัดบรรทัดภาษาไทยในคิวเจ้าของร้าน`;
    const secondCustomerName = `${e2eCustomerPrefix} คิวสำรองสำหรับทดสอบการจัดลำดับ`;
    await loginOwner(page);

    await page.goto("/owner/walk-in");
    await page.getByLabel("ชื่อลูกค้า").fill(customerName);
    await page.getByLabel("หมายเหตุ").fill("ทดสอบข้อความภาษาไทยยาวสำหรับ responsive queue action");
    await page.getByRole("button", { name: "เพิ่มเข้าคิววันนี้" }).click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);

    await page.goto("/owner/walk-in");
    await page.getByLabel("ชื่อลูกค้า").fill(secondCustomerName);
    await page.getByRole("button", { name: "เพิ่มเข้าคิววันนี้" }).click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);

    for (const viewport of [
      { width: 360, height: 800, table: false },
      { width: 390, height: 844, table: false },
      { width: 768, height: 1024, table: false },
      { width: 1024, height: 768, table: false },
      { width: 1180, height: 900, table: true },
      { width: 1360, height: 900, table: true },
      { width: 1440, height: 1000, table: true },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/owner");

      const board = page.locator(".bqa-owner-queue-board");
      const row = page.locator(".bqa-owner-queue-row").filter({ hasText: customerName });
      const manage = row.locator(".bqa-owner-queue-manage");
      const customerNameElement = row.locator(".bqa-owner-queue-customer-name");
      const boardBox = await board.boundingBox();
      const manageBox = await manage.boundingBox();

      await expect(page.locator(".bqa-owner-queue-head")).toBeVisible({ visible: viewport.table });
      if (viewport.table) {
        await expect(page.locator(".bqa-owner-queue-head > span")).toHaveCount(4);
      }
      expect(await customerNameElement.getAttribute("title")).toContain(customerName);
      await expect(row.locator(".bqa-owner-queue-main .ui-badge")).toBeVisible();
      await expect(row.locator(".bqa-owner-queue-time")).not.toHaveText("รอ");
      await expect(row.locator(".bqa-owner-queue-time .sr-only")).toHaveText(/ลำดับคิว|เวลา/);
      await expect(row.locator(".bqa-owner-queue-edit svg")).toHaveCount(1);
      await expect(row.locator(".bqa-owner-queue-pin svg")).toHaveCount(1);
      await expect(row.locator(".bqa-owner-queue-share svg")).toHaveCount(1);
      await expect(row.locator(".bqa-owner-queue-edit")).toHaveAttribute("title", "แก้ไขคิว");
      await expect(row.locator(".bqa-owner-queue-share")).toHaveAttribute("title", /คัดลอกคิว|คัดลอกแล้ว|แชร์แล้ว|เปิดหน้าคิว/);
      await expect(row.locator(".bqa-owner-reorder-actions--desktop")).toHaveCount(0);
      const reorderDisclosure = row.locator(".bqa-owner-reorder-disclosure");
      await expect(reorderDisclosure).toBeVisible();
      await expect(reorderDisclosure.locator("summary svg")).toHaveCount(2);
      await reorderDisclosure.locator("summary").click();
      await expect(reorderDisclosure.getByRole("button", { name: /เลื่อน .* ขึ้น/ })).toBeVisible();
      await expect(reorderDisclosure.getByRole("button", { name: /เลื่อน .* ลง/ })).toBeVisible();
      await expect(reorderDisclosure.getByRole("button", { name: /ไปท้ายคิว/ })).toBeVisible();
      if (viewport.width < 760) {
        const [editBox, shareBox] = await Promise.all([
          row.locator(".bqa-owner-queue-edit").boundingBox(),
          row.locator(".bqa-owner-queue-share").boundingBox(),
        ]);
        expect(editBox?.height ?? 0).toBeGreaterThanOrEqual(44);
        expect(shareBox?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
      const customerNameMetrics = await customerNameElement.evaluate((element) => {
        const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);

        return { clientHeight: element.clientHeight, lineHeight };
      });
      expect(customerNameMetrics.clientHeight).toBeLessThanOrEqual((customerNameMetrics.lineHeight * 2) + 1);
      expect((manageBox?.x ?? 0) + (manageBox?.width ?? 0)).toBeLessThanOrEqual((boardBox?.x ?? 0) + (boardBox?.width ?? 0));
      await expectNoHorizontalOverflow(page);
      await reorderDisclosure.locator("summary").click();
      await expect(page.getByRole("button", { name: "ยังไม่ถึงคิว" })).toHaveCount(0);
      const passiveStatus = page.locator(".bqa-owner-passive-action").first();
      if ((await passiveStatus.count()) > 0) {
        await expect(passiveStatus).toContainText("รอคิวก่อนหน้า");
      }

      if (viewport.width < 1024) {
        const actionHeights = await row.locator(".bqa-owner-board-actions .ui-button").evaluateAll((buttons) =>
          buttons.map((button) => button.getBoundingClientRect().height),
        );
        expect(Math.min(...actionHeights)).toBeGreaterThanOrEqual(44);
        await row.scrollIntoViewIfNeeded();
        const rowBox = await row.boundingBox();
        const navBox = await page.locator(".bqa-owner-mobile-bottom-nav").boundingBox();
        const clearance = (navBox?.y ?? 0) - ((rowBox?.y ?? 0) + (rowBox?.height ?? 0));
        expect(clearance).toBeGreaterThanOrEqual(16);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner");
    const mobileRow = page.locator(".bqa-owner-queue-row").filter({ hasText: customerName });
    await mobileRow.getByRole("button", { name: "ยกเลิก" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.locator(".bqa-confirm-target")).toHaveCSS("background-color", "rgb(247, 247, 245)");
    await expect(page.getByRole("button", { name: "กลับไปก่อน" })).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const dialogBox = await page.getByRole("alertdialog").boundingBox();
    const confirmButton = page.getByRole("button", { name: "ยืนยันยกเลิก" });
    const confirmBox = await confirmButton.boundingBox();
    await expect(confirmButton).toHaveCSS("background-color", "rgb(247, 236, 235)");
    await expect(confirmButton).toHaveCSS("color", "rgb(162, 64, 56)");
    expect(confirmBox?.width ?? 0).toBeGreaterThanOrEqual(120);
    expect((confirmBox?.x ?? 0) + (confirmBox?.width ?? 0)).toBeLessThanOrEqual((dialogBox?.x ?? 0) + (dialogBox?.width ?? 0));
    await confirmButton.click();
    await expect(page).toHaveURL(/\/owner(?:\?.*)?$/);
    const closedRow = page.locator(".bqa-owner-closed-mobile li").filter({ hasText: customerName });
    const cancelledBadge = closedRow.getByText("ยกเลิก", { exact: true });
    await expect(cancelledBadge).toHaveClass(/ui-badge--danger/);
    await expect(cancelledBadge).toHaveCSS("background-color", "rgb(248, 216, 213)");
  });
});
