import { expect, type Page, test } from "@playwright/test";
import { loginOwner, skipWhenE2eEnvMissing } from "./helpers";

const expectNoHorizontalOverflow = async (page: Page) => {
  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(viewport.scrollWidth).toBe(viewport.clientWidth);
};

test.describe("owner walk-in V2 responsive workbench", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
  });

  test("keeps form ownership and shell geometry stable at all required viewports", async ({ page }) => {
    await loginOwner(page);

    for (const viewport of [
      { width: 360, height: 800, sidebar: false, bottomNav: true },
      { width: 390, height: 844, sidebar: false, bottomNav: true },
      { width: 768, height: 1024, sidebar: false, bottomNav: true },
      { width: 1024, height: 768, sidebar: true, bottomNav: false },
      { width: 1180, height: 900, sidebar: true, bottomNav: false },
      { width: 1399, height: 900, sidebar: true, bottomNav: false },
      { width: 1400, height: 900, sidebar: true, bottomNav: false },
      { width: 1440, height: 1000, sidebar: true, bottomNav: false },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/owner/walk-in");

      await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-walkin-v2")).toBeVisible();
      await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible({ visible: viewport.sidebar });
      await expect(page.locator(".bqa-owner-mobile-bottom-nav")).toBeVisible({ visible: viewport.bottomNav });
      await expect(page.locator("[aria-current='page']:visible")).toContainText("เพิ่มคิว");
      await expect(page.getByRole("heading", { name: "เพิ่มคิว", level: 1 })).toBeVisible();
      await expect(page.getByLabel("บริการ")).toHaveCSS("min-height", "48px");
      await expect(page.getByLabel("ชื่อลูกค้า")).toHaveCSS("min-height", "48px");
      await expect(page.getByRole("button", { name: "เพิ่มเข้าคิววันนี้" })).toHaveCSS("min-height", "52px");
      await expectNoHorizontalOverflow(page);

      if (viewport.bottomNav) {
        const submitBar = await page.locator(".bqa-owner-walkin-submit-bar").boundingBox();
        const bottomNav = await page.locator(".bqa-owner-mobile-bottom-nav").boundingBox();
        expect((submitBar?.y ?? 0) + (submitBar?.height ?? 0)).toBeLessThanOrEqual(bottomNav?.y ?? 0);
      }
    }
  });

  test("keeps the service Select portal explicitly scoped and keyboard safe", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/walk-in");

    const trigger = page.getByLabel("บริการ");
    await trigger.focus();
    await trigger.press("Enter");

    const content = page.locator(".qw-v2-select-content");
    await expect(content).toBeVisible();
    await expect(content).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await page.keyboard.press("Escape");
    await expect(content).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
