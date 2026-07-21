import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { getDatabaseUrl, getE2eOpenHoursAroundNow, skipWhenE2eEnvMissing } from "./helpers";

test.describe("customer home V2 responsive ownership", () => {
  test("keeps customer actions, status and lookup contained across route boundaries", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 800, columns: false },
      { width: 390, height: 844, columns: false },
      { width: 420, height: 844, columns: false },
      { width: 421, height: 844, columns: false },
      { width: 559, height: 900, columns: false },
      { width: 560, height: 900, columns: false },
      { width: 768, height: 1024, columns: false },
      { width: 859, height: 900, columns: false },
      { width: 860, height: 900, columns: true },
      { width: 1024, height: 768, columns: true },
      { width: 1440, height: 1000, columns: true },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-home-v2")).toBeVisible();
      await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);
      await expect(page.locator(".bqa-status-image")).toBeVisible();
      await expect(page.getByRole("button", { name: "เช็คสถานะคิว" })).toHaveCSS("min-height", "48px");

      const actionHeights = await page.locator(".bqa-home-actions .bqa-action-card").evaluateAll((actions) =>
        actions.map((action) => action.getBoundingClientRect().height),
      );
      expect(Math.min(...actionHeights)).toBeGreaterThanOrEqual(72);

      const primary = await page.locator(".bqa-home-primary").boundingBox();
      const secondary = await page.locator(".bqa-home-secondary").boundingBox();
      if (viewport.columns) {
        expect(primary?.width ?? 0).toBeGreaterThan(300);
        expect(secondary?.width ?? 0).toBeGreaterThan(300);
        expect(secondary?.x ?? 0).toBeGreaterThan((primary?.x ?? 0) + (primary?.width ?? 0));
      } else {
        expect(secondary?.y ?? 0).toBeGreaterThanOrEqual((primary?.y ?? 0) + (primary?.height ?? 0));
      }

      const width = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(width.scroll).toBe(width.client);
    }
  });

  test("keeps queue lookup errors inside the customer V2 route", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator("main[data-customer-visual='v2']")).toBeVisible();
    await page.getByLabel("รหัสคิว").fill("Q-LONG-TEST");
    await page.getByLabel("PIN เช็คคิว 4 ตัว").fill("0000");
    const errorMessage = page.getByText("ไม่พบคิวจากข้อมูลนี้ ลองตรวจรหัสคิวและ PIN อีกครั้ง").first();
    await page.getByRole("button", { name: "เช็คสถานะคิว" }).click();
    await expect(errorMessage).toBeVisible();
    await expect(page.locator('[aria-live="polite"]')).toContainText("ไม่พบคิวจากข้อมูลนี้");
    await expect(page.getByLabel("รหัสคิว")).toHaveValue("Q-LONG-TEST");
    await expect(page.locator(".bqa-home-tracking")).toBeVisible();
  });

  test("keeps booking and walk-in CTAs truthful across the global intake matrix", async ({ page }) => {
    skipWhenE2eEnvMissing();
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const original = await client.query<{
      id: string;
      businessHours: unknown;
      queueIntakeEnabled: boolean;
      bookingEnabled: boolean;
      walkInEnabled: boolean;
    }>(`select "id", "businessHours", "queueIntakeEnabled", "bookingEnabled", "walkInEnabled" from "ShopSettings" order by "createdAt" asc limit 1`);
    const settings = original.rows[0];
    expect(settings).toBeTruthy();

    const setMatrix = async ({ booking, intake, walkIn }: { booking: boolean; intake: boolean; walkIn: boolean }) => {
      await client.query(
        `update "ShopSettings" set "businessHours"=$1::jsonb, "queueIntakeEnabled"=$2, "bookingEnabled"=$3, "walkInEnabled"=$4 where "id"=$5`,
        [JSON.stringify(getE2eOpenHoursAroundNow()), intake, booking, walkIn, settings.id],
      );
    };

    try {
      await setMatrix({ booking: false, intake: true, walkIn: true });
      await page.goto("/");
      await expect(page.getByText("เปิดรับคิวออนไลน์", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /จองล่วงหน้า/ })).toBeDisabled();
      await expect(page.getByRole("link", { name: /รับบัตรคิวออนไลน์/ })).toHaveAttribute("href", "/walk-in");

      await setMatrix({ booking: true, intake: true, walkIn: false });
      await page.goto("/");
      await expect(page.getByText("เปิดจองล่วงหน้า", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /จองล่วงหน้า/ })).toHaveAttribute("href", "/book");
      await expect(page.getByRole("button", { name: /รับบัตรคิวออนไลน์/ })).toBeDisabled();

      await setMatrix({ booking: true, intake: false, walkIn: true });
      await page.goto("/");
      await expect(page.getByText("ปิดรับออนไลน์", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /จองล่วงหน้า/ })).toBeDisabled();
      await expect(page.getByRole("button", { name: /รับบัตรคิวออนไลน์/ })).toBeDisabled();
    } finally {
      await client.query(
        `update "ShopSettings" set "businessHours"=$1::jsonb, "queueIntakeEnabled"=$2, "bookingEnabled"=$3, "walkInEnabled"=$4 where "id"=$5`,
        [JSON.stringify(settings.businessHours), settings.queueIntakeEnabled, settings.bookingEnabled, settings.walkInEnabled, settings.id],
      );
      await client.end();
    }
  });

  test("keeps long Thai shop and service text contained without losing the full value", async ({ page }) => {
    skipWhenE2eEnvMissing();
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const shopResult = await client.query<{ id: string; shopName: string }>(`select "id", "shopName" from "ShopSettings" order by "createdAt" asc limit 1`);
    const serviceResult = await client.query<{ id: string; name: string }>(`select "id", "name" from "Service" where "isActive"=true order by "sortOrder" asc, "createdAt" asc limit 1`);
    const shop = shopResult.rows[0];
    const service = serviceResult.rows[0];
    const longShopName = "ร้านช่างหนึ่งบริการตัดผมสุภาพสำหรับลูกค้าทุกช่วงวัย";
    const longServiceName = "ตัดผมพร้อมสระและออกแบบทรงสุภาพสำหรับลูกค้าที่ต้องการรายละเอียดพิเศษ";

    try {
      await client.query(`update "ShopSettings" set "shopName"=$1 where "id"=$2`, [longShopName, shop.id]);
      await client.query(`update "Service" set "name"=$1 where "id"=$2`, [longServiceName, service.id]);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto("/");

      await expect(page.getByText(longShopName, { exact: true })).toBeVisible();
      const serviceName = page.locator(".bqa-service-row strong").filter({ hasText: longServiceName });
      await expect(serviceName).toHaveAttribute("title", longServiceName);
      const clamp = await serviceName.evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          clientHeight: element.clientHeight,
          lineHeight: Number.parseFloat(styles.lineHeight),
          scrollHeight: element.scrollHeight,
        };
      });
      expect(clamp.clientHeight).toBeLessThanOrEqual(clamp.lineHeight * 2 + 1);
      expect(clamp.scrollHeight).toBeGreaterThanOrEqual(clamp.clientHeight);
      const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(width.scroll).toBe(width.client);
    } finally {
      await client.query(`update "ShopSettings" set "shopName"=$1 where "id"=$2`, [shop.shopName, shop.id]);
      await client.query(`update "Service" set "name"=$1 where "id"=$2`, [service.name, service.id]);
      await client.end();
    }
  });

  test("keeps the customer keyboard path and visible focus order", async ({ page }) => {
    skipWhenE2eEnvMissing();
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const original = await client.query<{
      id: string;
      businessHours: unknown;
      queueIntakeEnabled: boolean;
      bookingEnabled: boolean;
      walkInEnabled: boolean;
    }>(`select "id", "businessHours", "queueIntakeEnabled", "bookingEnabled", "walkInEnabled" from "ShopSettings" order by "createdAt" asc limit 1`);
    const settings = original.rows[0];

    try {
      await client.query(
        `update "ShopSettings" set "businessHours"=$1::jsonb, "queueIntakeEnabled"=true, "bookingEnabled"=true, "walkInEnabled"=true where "id"=$2`,
        [JSON.stringify(getE2eOpenHoursAroundNow()), settings.id],
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");

      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: /จองล่วงหน้า/ })).toBeFocused();
      await expect(page.getByRole("link", { name: /จองล่วงหน้า/ })).toHaveCSS("outline-style", "solid");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: /รับบัตรคิวออนไลน์/ })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("รหัสคิว")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("PIN เช็คคิว 4 ตัว")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "เช็คสถานะคิว" })).toBeFocused();
    } finally {
      await client.query(
        `update "ShopSettings" set "businessHours"=$1::jsonb, "queueIntakeEnabled"=$2, "bookingEnabled"=$3, "walkInEnabled"=$4 where "id"=$5`,
        [JSON.stringify(settings.businessHours), settings.queueIntakeEnabled, settings.bookingEnabled, settings.walkInEnabled, settings.id],
      );
      await client.end();
    }
  });
});
