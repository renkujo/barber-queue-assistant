import { expect, type Page, test } from "@playwright/test";
import { loginOwner, skipWhenE2eEnvMissing } from "./helpers";

const getViewportWidthState = async (page: Page) =>
  page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

test.describe("owner services responsive settings", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
  });

  test("requires an owner session before showing service settings", async ({ page }) => {
    await page.goto("/owner/settings/services");

    await expect(page).toHaveURL(/\/owner\/login/);
    await expect(page.getByLabel("รหัสเจ้าของร้าน")).toBeVisible();
  });

  test("keeps add-service reachable early and one mobile editor open at a time", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/settings/services");

    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-services-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ตั้งค่าบริการ", level: 1 })).toBeVisible();
    await expect(page.locator(".bqa-owner-mobile-bottom-nav [aria-current='page']")).toContainText("เพิ่มเติม");

    const addPanel = page.locator(".bqa-owner-services-create-mobile");
    const listPanel = page.locator(".bqa-owner-services-list-panel");
    await expect(addPanel.getByText("เพิ่มบริการ").first()).toBeVisible();
    await expect(addPanel.locator("summary")).toHaveCSS("min-height", "48px");
    await expect(addPanel).toBeVisible();
    await expect(listPanel).toBeVisible();

    const addBox = await addPanel.boundingBox();
    const listBox = await listPanel.boundingBox();
    expect(addBox?.y ?? 0).toBeLessThan(listBox?.y ?? Number.POSITIVE_INFINITY);
    await addPanel.locator("summary").click();
    await expect(addPanel.getByRole("button", { name: "เพิ่มบริการ" })).toHaveCSS("min-height", "44px");

    const disclosures = page.locator(".bqa-owner-service-disclosure");
    await expect(disclosures.first()).toHaveAttribute("open", "");
    await expect(page.locator(".bqa-owner-service-editor:visible")).toHaveCount(1);
    await expect(page.locator(".bqa-owner-service-editor:visible .bqa-owner-service-update-form input[name='serviceId']")).toHaveCount(1);
    await expect(page.locator(".bqa-owner-service-editor:visible input[name='name']")).toBeVisible();
    await expect(page.locator(".bqa-owner-service-editor:visible input[name='durationMinutes']")).toBeVisible();
    await expect(page.locator(".bqa-owner-service-editor:visible input[name='priceBaht']")).toBeVisible();
    await expect(page.locator(".bqa-owner-service-editor:visible input[name='sortOrder']")).toBeVisible();
    await expect(page.locator(".bqa-owner-service-editor:visible .bqa-owner-service-update-form [name='isActive']")).toHaveCount(1);

    if ((await disclosures.count()) > 1) {
      await disclosures.nth(1).locator("summary").click();
      await expect(disclosures.nth(1)).toHaveAttribute("open", "");
      await expect(page.locator(".bqa-owner-service-editor:visible")).toHaveCount(1);
    }

    const inactiveRows = page.locator(".bqa-owner-service-disclosure:has(.bqa-owner-service-toggle-form button:has-text('เปิดใช้บริการ'))");
    if ((await inactiveRows.count()) > 0) {
      await inactiveRows.first().locator("summary").click();
      await expect(inactiveRows.first().locator(".bqa-owner-service-status")).toContainText("ปิดใช้");
      await expect(inactiveRows.first().locator(".bqa-owner-service-toggle-form button")).toContainText("เปิดใช้บริการ");
    }

    const viewport = await getViewportWidthState(page);
    expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  });

  test("shows a connected aligned desktop workbench with a right-rail create form", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/owner/settings/services");

    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-services-page")).toBeVisible();
    await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible();
    await expect(page.locator(".bqa-owner-desktop-nav [aria-current='page']")).toContainText("บริการ");
    await expect(page.locator(".bqa-owner-services-table-head")).toBeVisible();
    await expect(page.locator(".bqa-owner-service-settings-card")).toHaveCount(0);
    await expect(page.locator(".bqa-owner-services-create-rail").getByRole("heading", { name: "เพิ่มบริการ" })).toBeVisible();
    await expect(page.locator(".bqa-owner-services-create-rail input[name='isActive']")).toHaveValue("true");
    await expect(page.locator(".bqa-owner-service-editor:visible")).toHaveCount(1);
    await expect(page.locator("form[action] input[name='serviceId']").first()).toBeAttached();

    const serviceHeader = await page.locator(".bqa-owner-services-list-panel").boundingBox();
    const createRail = await page.locator(".bqa-owner-services-create-rail").boundingBox();
    expect((createRail?.x ?? 0) > (serviceHeader?.x ?? 0)).toBe(true);
    const table = page.locator(".bqa-owner-services-table");
    const tableBox = await table.boundingBox();
    const actionBox = await page.locator(".bqa-owner-service-summary").first().locator(".bqa-owner-service-action-label").boundingBox();
    const tableWidth = await table.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }));
    expect(tableWidth.scroll).toBeLessThanOrEqual(tableWidth.client + 2);
    expect((actionBox?.x ?? 0) + (actionBox?.width ?? 0)).toBeLessThanOrEqual((tableBox?.x ?? 0) + (tableBox?.width ?? 0));

    const viewport = await getViewportWidthState(page);
    expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  });

  test("keeps the connected service list contained at tablet and compact desktop widths", async ({ page }) => {
    await loginOwner(page);

    for (const viewport of [
      { width: 768, height: 1024, sidebar: false },
      { width: 1024, height: 768, sidebar: true },
      { width: 1180, height: 900, sidebar: true },
      { width: 1399, height: 900, sidebar: true },
      { width: 1400, height: 900, sidebar: true },
      { width: 1439, height: 900, sidebar: true },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/owner/settings/services");

      await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible({ visible: viewport.sidebar });
      await expect(page.locator(".bqa-owner-services-list-panel")).toBeVisible();
      await expect(page.locator(".bqa-owner-services-table-head")).toBeHidden();
      await expect(page.locator(".bqa-owner-service-cell:visible")).toHaveCount(0);
      const listBox = await page.locator(".bqa-owner-services-list-panel").boundingBox();
      const tableBox = await page.locator(".bqa-owner-services-table").boundingBox();
      expect((tableBox?.x ?? 0) + (tableBox?.width ?? 0)).toBeLessThanOrEqual((listBox?.x ?? 0) + (listBox?.width ?? 0));
      const tableWidth = await page.locator(".bqa-owner-services-table").evaluate((element) => ({
        client: element.clientWidth,
        scroll: element.scrollWidth,
      }));
      expect(tableWidth.scroll).toBe(tableWidth.client);

      const width = await getViewportWidthState(page);
      expect(width.scrollWidth).toBe(width.clientWidth);
    }
  });

  test("keeps service status Select portals explicitly scoped", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/settings/services");

    const trigger = page.locator(".bqa-owner-service-editor:visible .ui-select-trigger");
    await trigger.click();
    await expect(page.locator(".qw-v2-select-content")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".qw-v2-select-content")).toBeHidden();
  });
});
