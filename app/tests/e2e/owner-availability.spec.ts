import { expect, test } from "@playwright/test";
import { loginOwner, skipWhenE2eEnvMissing } from "./helpers";

test.describe("owner availability schedule", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
  });

  test("keeps seven independent weekly forms while recomposing mobile disclosures", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/settings/availability");

    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-availability-v2")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ตารางรับลูกค้าประจำสัปดาห์", level: 1 })).toBeVisible();
    await expect(page.locator(".bqa-owner-mobile-bottom-nav [aria-current='page']")).toContainText("ตาราง");

    const weeklyDisclosures = page.locator(".bqa-owner-weekly-disclosure");
    await expect(weeklyDisclosures).toHaveCount(7);
    await expect(page.locator(".bqa-owner-weekly-row")).toHaveCount(7);
    await expect(page.locator(".bqa-owner-weekly-row:visible")).toHaveCount(1);
    await expect(weeklyDisclosures.first()).toHaveAttribute("open", "");

    await expect(weeklyDisclosures.nth(1).locator(".bqa-owner-weekly-summary")).toContainText("วันอังคาร");
    await weeklyDisclosures.nth(1).locator(".bqa-owner-weekly-summary").click();
    await expect(weeklyDisclosures.nth(1)).toHaveAttribute("open", "");
    await expect(page.locator(".bqa-owner-weekly-row:visible")).toHaveCount(2);

    const saveButtons = page.locator(".bqa-owner-weekly-row .ui-button[type='submit']");
    await expect(saveButtons).toHaveCount(7);
    await expect(saveButtons.first()).toHaveCSS("min-height", "48px");
    await expect(page.getByText("วันพิเศษ 14 วันข้างหน้า")).toHaveCount(0);

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  });

  test("stacks the weekly preset below its heading without wrapping on narrow mobile", async ({ page }) => {
    await loginOwner(page);

    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/owner/settings/availability");

      const header = page.locator(".bqa-owner-weekly-schedule-panel > .bqa-section-header");
      const heading = header.locator(":scope > div");
      const presetForm = header.locator(":scope > form");
      const presetButton = header.locator(".bqa-owner-weekly-preset-button");
      const [headerBox, headingBox, formBox, buttonBox] = await Promise.all([
        header.boundingBox(),
        heading.boundingBox(),
        presetForm.boundingBox(),
        presetButton.boundingBox(),
      ]);

      expect(formBox?.y ?? 0).toBeGreaterThanOrEqual((headingBox?.y ?? 0) + (headingBox?.height ?? 0) + 12);
      expect(buttonBox?.width ?? 0).toBeGreaterThanOrEqual((headerBox?.width ?? 0) - 26);

      const textLineCount = await presetButton.evaluate((element) => {
        const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
        if (!textNode) return 0;
        const range = document.createRange();
        range.selectNode(textNode);
        return range.getClientRects().length;
      });
      expect(textLineCount).toBe(1);

      const width = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(width.scroll).toBe(width.client);
    }
  });

  test("gives expanded mobile fields breathing room without nested field borders", async ({ page }) => {
    await loginOwner(page);

    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/owner/settings/availability");

      const row = page.locator(".bqa-owner-weekly-row:visible").first();
      const fields = row.locator(".ui-form-field");
      const modeField = fields.nth(0);
      const reasonField = fields.nth(1);
      const modeLabel = modeField.locator(".ui-form-label-group");
      const reasonLabel = reasonField.locator(".ui-form-label-group");
      const modeControl = modeField.locator(".ui-select-trigger");
      const reasonControl = reasonField.locator(".ui-input");
      const saveButton = row.locator(".bqa-owner-weekly-save-button");
      const [modeFieldBox, reasonFieldBox, modeLabelBox, reasonLabelBox, modeControlBox, reasonControlBox, saveButtonBox] = await Promise.all([
        modeField.boundingBox(),
        reasonField.boundingBox(),
        modeLabel.boundingBox(),
        reasonLabel.boundingBox(),
        modeControl.boundingBox(),
        reasonControl.boundingBox(),
        saveButton.boundingBox(),
      ]);

      expect((modeControlBox?.y ?? 0) - ((modeLabelBox?.y ?? 0) + (modeLabelBox?.height ?? 0))).toBeGreaterThanOrEqual(8);
      expect((reasonControlBox?.y ?? 0) - ((reasonLabelBox?.y ?? 0) + (reasonLabelBox?.height ?? 0))).toBeGreaterThanOrEqual(8);
      expect((reasonFieldBox?.y ?? 0) - ((modeFieldBox?.y ?? 0) + (modeFieldBox?.height ?? 0))).toBeGreaterThanOrEqual(16);
      expect((saveButtonBox?.y ?? 0) - ((reasonFieldBox?.y ?? 0) + (reasonFieldBox?.height ?? 0))).toBeGreaterThanOrEqual(16);
      await expect(modeField).toHaveCSS("border-top-width", "0px");
      await expect(reasonField).toHaveCSS("border-top-width", "0px");

      const width = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(width.scroll).toBe(width.client);
    }
  });

  test("shows one connected seven-row desktop schedule with aligned owned forms", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/owner/settings/availability");

    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-availability-v2")).toBeVisible();
    await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible();
    await expect(page.locator(".bqa-owner-desktop-nav [aria-current='page']")).toContainText("ตารางรับลูกค้า");
    await expect(page.locator(".bqa-owner-weekly-schedule-head")).toBeVisible();
    await expect(page.locator(".bqa-owner-weekly-row:visible")).toHaveCount(7);
    await expect(page.locator(".bqa-owner-weekly-summary:visible")).toHaveCount(0);
    await expect(page.locator(".bqa-owner-weekly-row .ui-button[type='submit']")).toHaveCount(7);
    await expect(page.locator(".bqa-owner-availability-legend")).toBeVisible();

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  });

  test("keeps disclosure ownership until the connected schedule has enough width", async ({ page }) => {
    await loginOwner(page);

    for (const viewport of [
      { width: 768, height: 1024, connected: false },
      { width: 1024, height: 768, connected: false },
      { width: 1180, height: 900, connected: false },
      { width: 1399, height: 900, connected: false },
      { width: 1400, height: 900, connected: true },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/owner/settings/availability");

      await expect(page.locator(".bqa-owner-weekly-schedule-head")).toBeVisible({ visible: viewport.connected });
      await expect(page.locator(".bqa-owner-weekly-summary:visible")).toHaveCount(viewport.connected ? 0 : 7);
      await expect(page.locator(".bqa-owner-weekly-row:visible")).toHaveCount(viewport.connected ? 7 : 1);

      const width = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(width.scroll).toBe(width.client);
    }
  });

  test("keeps availability Select portals explicitly scoped", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/settings/availability");

    const trigger = page.locator("#weekly-mode-1");
    await trigger.click();
    await expect(page.locator(".qw-v2-select-content")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".qw-v2-select-content")).toBeHidden();
  });
});
