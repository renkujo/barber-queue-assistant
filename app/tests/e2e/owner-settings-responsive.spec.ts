import { expect, type Page, test } from "@playwright/test";
import { loginOwner, skipWhenE2eEnvMissing } from "./helpers";

const getViewportWidthState = async (page: Page) =>
  page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

const expectNoHorizontalOverflow = async (page: Page) => {
  const viewport = await getViewportWidthState(page);
  expect(viewport.scrollWidth).toBe(viewport.clientWidth);
};

const expectOperationalMonochromeSidebar = async (page: Page) => {
  const sidebar = page.locator(".bqa-owner-desktop-sidebar");
  const activeItem = page.locator(".bqa-owner-desktop-nav [aria-current='page']");
  const footer = page.locator(".bqa-owner-sidebar-footer");
  const sidebarBox = await sidebar.boundingBox();
  const footerBox = await footer.boundingBox();
  const viewport = page.viewportSize();

  await expect(sidebar).toHaveCSS("background-color", "rgb(23, 18, 15)");
  await expect(sidebar).toHaveCSS("border-radius", "16px");
  await expect(activeItem).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(activeItem).toHaveCSS("color", "rgb(23, 18, 15)");
  await expect(page.locator(".bqa-owner-sidebar-brand strong")).toHaveCSS("color", "rgb(255, 255, 255)");
  expect(sidebarBox?.x).toBe(16);
  expect(sidebarBox?.y).toBe(16);
  expect((sidebarBox?.y ?? 0) + (sidebarBox?.height ?? 0)).toBeLessThanOrEqual((viewport?.height ?? 0) - 16);
  expect((footerBox?.y ?? 0) + (footerBox?.height ?? 0)).toBeLessThanOrEqual((sidebarBox?.y ?? 0) + (sidebarBox?.height ?? 0));
};

test.describe("owner settings responsive workbench", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
  });

  test("keeps mobile hub links before the flat owned settings form", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/owner/settings");

    await expect(page.locator("main[data-owner-visual='v2']")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ตั้งค่าร้าน", level: 1 })).toBeVisible();
    await expect(page.locator(".bqa-owner-mobile-bottom-nav [aria-current='page']")).toContainText("เพิ่มเติม");

    const hub = page.locator(".bqa-owner-settings-hub");
    const form = page.locator(".bqa-owner-settings-form");
    await expect(hub).toBeVisible();
    await expect(form).toBeVisible();
    await expect(hub.getByRole("link", { name: /LINE เจ้าของร้าน/ })).toBeVisible();
    await expect(hub.getByRole("link", { name: /ตั้งค่าวันรับคิว/ })).toBeVisible();
    await expect(hub.getByRole("link", { name: /จัดการบริการ/ })).toBeVisible();

    const hubBox = await hub.boundingBox();
    const formBox = await form.boundingBox();
    expect(hubBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(formBox?.y ?? 0);

    await expect(page.locator("input[name='shopName']")).toBeVisible();
    await expect(page.locator("input[name='openTime']")).toBeVisible();
    await expect(page.locator("input[name='closeTime']")).toBeVisible();
    await expect(page.locator("[name='queueIntakeEnabled']")).toBeAttached();
    await expect(page.locator("[name='bookingEnabled']")).toBeAttached();
    await expect(page.locator("[name='walkInEnabled']")).toBeAttached();
    await expect(page.locator("input[name='manualWaitMinutes']")).toBeVisible();
    await expect(page.getByRole("button", { name: "บันทึกตั้งค่า" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "บันทึกตั้งค่า" })).toHaveCSS("min-height", "48px");
    const firstHubRowBox = await hub.locator(".bqa-owner-settings-hub-row").first().boundingBox();
    expect(firstHubRowBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await expectNoHorizontalOverflow(page);
  });

  test("shows a desktop settings workbench with real right-rail destinations", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/owner/settings");

    await expect(page.locator("main[data-owner-visual='v2']")).toBeVisible();
    await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible();
    await expect(page.locator(".bqa-owner-desktop-nav [aria-current='page']")).toContainText("ตั้งค่าร้าน");
    await expect(page.locator(".bqa-owner-settings-form-panel")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-rail")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-hub")).toBeHidden();
    await expect(page.getByRole("button", { name: "บันทึกตั้งค่า" })).toHaveCount(1);
    await expect(page.locator(".bqa-owner-settings-rail").getByText("ผลของการตั้งค่า")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-rail").getByRole("heading", { name: "LINE เจ้าของร้าน" })).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-rail").getByRole("link", { name: /ตั้งค่าวันรับคิว/ })).toHaveAttribute("href", "/owner/settings/availability");
    await expect(page.locator(".bqa-owner-settings-rail").getByRole("link", { name: /จัดการบริการ/ })).toHaveAttribute("href", "/owner/settings/services");
    await expectOperationalMonochromeSidebar(page);

    const actionGeometry = await page.locator(".bqa-owner-settings-rail-panel:has(.bqa-owner-support-action)").evaluateAll((panels) =>
      panels.map((panel) => {
        const action = panel.querySelector<HTMLElement>(".bqa-owner-support-action");
        const panelBox = panel.getBoundingClientRect();
        const actionBox = action?.getBoundingClientRect();

        return {
          panelLeft: panelBox.left,
          panelRight: panelBox.right,
          actionLeft: actionBox?.left ?? Number.NEGATIVE_INFINITY,
          actionRight: actionBox?.right ?? Number.POSITIVE_INFINITY,
        };
      }),
    );

    expect(actionGeometry).toHaveLength(3);
    for (const geometry of actionGeometry) {
      expect(geometry.actionLeft).toBeGreaterThanOrEqual(geometry.panelLeft);
      expect(geometry.actionRight).toBeLessThanOrEqual(geometry.panelRight);
    }

    const formBox = await page.locator(".bqa-owner-settings-form-panel").boundingBox();
    const railBox = await page.locator(".bqa-owner-settings-rail").boundingBox();
    expect((railBox?.x ?? 0) > (formBox?.x ?? Number.POSITIVE_INFINITY)).toBe(true);

    await expectNoHorizontalOverflow(page);
  });

  test("keeps tablet ownership layout free of horizontal overflow", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/owner/settings");

    await expect(page.locator("main[data-owner-visual='v2']")).toBeVisible();
    await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-form-panel")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-hub")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-rail")).toBeHidden();
    await expect(page.getByRole("button", { name: "บันทึกตั้งค่า" })).toHaveCount(1);
    await expectOperationalMonochromeSidebar(page);

    await expectNoHorizontalOverflow(page);
  });

  test("keeps V2 scoped to promoted owner routes", async ({ page }) => {
    await loginOwner(page);

    await page.goto("/owner/settings");
    await expect(page.locator("main[data-owner-visual='v2']")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-hub-row--line")).toHaveAttribute("href", "/owner/settings/line-connect");

    await page.goto("/owner");
    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-dashboard-content")).toBeVisible();
    await expect(page.locator("main[data-owner-visual='legacy']")).toHaveCount(0);

    await page.goto("/owner/settings/availability");
    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-availability-v2")).toBeVisible();
    await expect(page.locator("main[data-owner-visual='legacy']")).toHaveCount(0);

    await page.goto("/owner/walk-in");
    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-walkin-v2")).toBeVisible();

    await page.goto("/owner/settings/services");
    await expect(page.locator("main[data-owner-visual='v2'] .bqa-owner-services-page")).toBeVisible();

    await page.goto("/");
    await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-home-v2")).toBeVisible();
    await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);

    await page.goto("/book");
    await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-book-v2")).toBeVisible();
    await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);

    await page.goto("/walk-in");
    await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-walkin-v2")).toBeVisible();
    await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);

    await page.goto("/privacy");
    await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-privacy-v2")).toBeVisible();
    await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);
  });

  test("keeps large-mobile and tablet V2 layouts stable", async ({ page }) => {
    await loginOwner(page);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/owner/settings");

      await expect(page.locator("main[data-owner-visual='v2']")).toBeVisible();
      await expect(page.locator(".bqa-owner-mobile-bottom-nav")).toBeVisible();
      await expect(page.locator(".bqa-owner-settings-hub")).toBeVisible();
      const saveButton = page.getByRole("button", { name: "บันทึกตั้งค่า" });
      const expectedPrimaryHeight = viewport.width < 760 ? 48 : 44;
      await expect(saveButton).toHaveCSS("min-height", `${expectedPrimaryHeight}px`);
      await expectNoHorizontalOverflow(page);

      await saveButton.scrollIntoViewIfNeeded();
      const saveBox = await saveButton.boundingBox();
      const bottomNavBox = await page.locator(".bqa-owner-mobile-bottom-nav").boundingBox();
      const bottomNavClearance = (bottomNavBox?.y ?? 0) - ((saveBox?.y ?? 0) + (saveBox?.height ?? 0));
      expect(bottomNavClearance).toBeGreaterThanOrEqual(16);
    }
  });

  test("styles the portaled select and preserves keyboard dismissal", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/settings");

    const trigger = page.locator("#queueIntakeEnabled");
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-describedby", "queueIntakeEnabled-description");
    await expect(trigger).toHaveCSS("outline-color", "rgb(61, 95, 204)");

    await trigger.press("Enter");
    const content = page.locator(".ui-select-content");
    await expect(content).toBeVisible();
    await expect(content).toHaveClass(/qw-v2-select-content/);
    await expect(content).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await page.keyboard.press("Escape");
    await expect(content).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("keeps the boolean badge truthful before save", async ({ page }) => {
    await loginOwner(page);
    await page.goto("/owner/settings");

    const field = page.locator(".ui-form-field:has(#queueIntakeEnabled)");
    const trigger = field.locator("#queueIntakeEnabled");
    const state = field.locator(".bqa-owner-settings-state");
    const currentState = (await state.textContent())?.trim();
    const nextState = currentState === "เปิด" ? "ปิด" : "เปิด";

    await trigger.click();
    await page.getByRole("option", { name: nextState, exact: true }).click();
    await expect(state).toHaveText(nextState);
  });

  test("keeps V2 component ownership stable at boundary widths", async ({ page }) => {
    await loginOwner(page);

    for (const viewport of [
      { width: 760, height: 900, mobile: true, columns: 1, rail: false },
      { width: 767, height: 900, mobile: true, columns: 1, rail: false },
      { width: 768, height: 1024, mobile: true, columns: 3, rail: false },
      { width: 1023, height: 900, mobile: true, columns: 3, rail: false },
      { width: 1024, height: 900, mobile: false, columns: 3, rail: false },
      { width: 1179, height: 900, mobile: false, columns: 3, rail: false },
      { width: 1180, height: 900, mobile: false, columns: 0, rail: true },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/owner/settings");

      await expect(page.locator(".bqa-owner-mobile-bottom-nav")).toBeVisible({ visible: viewport.mobile });
      await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible({ visible: !viewport.mobile });
      await expect(page.locator(".bqa-owner-settings-rail")).toBeVisible({ visible: viewport.rail });

      const hub = page.locator(".bqa-owner-settings-hub");
      await expect(hub).toBeVisible({ visible: viewport.columns > 0 });

      if (viewport.columns > 0) {
        const columnCount = await hub.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        expect(columnCount).toBe(viewport.columns);
      }

      await expectNoHorizontalOverflow(page);
    }
  });

  test("submits the unchanged settings contract successfully", async ({ page }) => {
    await loginOwner(page);
    await page.goto("/owner/settings");

    await page.getByRole("button", { name: "บันทึกตั้งค่า" }).click();
    await expect(page).toHaveURL(/\/owner\/settings\?status=settings-updated$/);
    await expect(page.locator("main[data-owner-visual='v2']")).toBeVisible();
  });

  test("connects FormField errors to their matching control", async ({ page }) => {
    await page.goto("/owner/login?error=invalid");

    const passcode = page.getByLabel("รหัสเจ้าของร้าน");
    await expect(passcode).toHaveAttribute("aria-invalid", "true");
    await expect(passcode).toHaveAttribute("aria-describedby", "passcode-error");
    await expect(passcode).toHaveAttribute("aria-errormessage", "passcode-error");
    await expect(page.locator("#passcode-error")).toHaveText("รหัสเข้าหน้าเจ้าของร้านไม่ถูกต้อง");
  });
});
