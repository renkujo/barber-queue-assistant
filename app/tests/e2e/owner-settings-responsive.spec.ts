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

test.describe("owner settings responsive workbench", () => {
  test.beforeEach(async () => {
    skipWhenE2eEnvMissing();
  });

  test("keeps mobile hub links before the flat owned settings form", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/owner/settings");

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

    const formBox = await page.locator(".bqa-owner-settings-form-panel").boundingBox();
    const railBox = await page.locator(".bqa-owner-settings-rail").boundingBox();
    expect((railBox?.x ?? 0) > (formBox?.x ?? Number.POSITIVE_INFINITY)).toBe(true);

    await expectNoHorizontalOverflow(page);
  });

  test("keeps tablet ownership layout free of horizontal overflow", async ({ page }) => {
    await loginOwner(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/owner/settings");

    await expect(page.locator(".bqa-owner-desktop-sidebar")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-form-panel")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-hub")).toBeVisible();
    await expect(page.locator(".bqa-owner-settings-rail")).toBeHidden();
    await expect(page.getByRole("button", { name: "บันทึกตั้งค่า" })).toHaveCount(1);

    await expectNoHorizontalOverflow(page);
  });
});
