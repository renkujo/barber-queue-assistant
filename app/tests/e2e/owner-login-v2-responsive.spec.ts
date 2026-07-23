import { expect, test } from "@playwright/test";
import { skipWhenE2eEnvMissing } from "./helpers";

test.describe("owner login V2 responsive ownership", () => {
  test.beforeEach(() => {
    skipWhenE2eEnvMissing();
  });

  test("keeps login card, sections and controls contained across breakpoints", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 559, height: 900 },
      { width: 560, height: 900 },
      { width: 759, height: 900 },
      { width: 760, height: 900 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/owner/login");

      await expect(page.locator("main[data-customer-visual='v2'].bqa-owner-login-v2")).toBeVisible();
      const blocks = await page.locator(".bqa-owner-login-card-v2 > .bqa-page-header, .bqa-owner-login-card-v2 > .bqa-owner-login-copy, .bqa-owner-login-card-v2 > .bqa-notice, .bqa-owner-login-card-v2 > .bqa-owner-login-form").all();
      const boxes = await Promise.all(blocks.map((block) => block.boundingBox()));
      for (let index = 1; index < boxes.length; index += 1) {
        const previous = boxes[index - 1];
        const current = boxes[index];
        expect((current?.y ?? 0) - ((previous?.y ?? 0) + (previous?.height ?? 0))).toBeGreaterThanOrEqual(12);
      }

      const input = page.getByLabel("รหัสเจ้าของร้าน");
      const submit = page.getByRole("button", { name: "เข้าสู่ระบบ" });
      const expectedControlHeight = viewport.width < 760 ? 44 : 40;
      const expectedPrimaryHeight = viewport.width < 760 ? 48 : 44;
      expect((await input.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(expectedControlHeight);
      expect((await submit.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(expectedPrimaryHeight);
      const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(width.scroll).toBe(width.client);
    }
  });

  test("preserves invalid, rate-limited and setup error semantics with long Thai wrapping", async ({ page }) => {
    for (const [error, message] of [
      ["invalid", "รหัสเข้าหน้าเจ้าของร้านไม่ถูกต้อง"],
      ["rate-limited", "ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่"],
      ["setup", "ยังไม่ได้ตั้งค่า BARBER_ADMIN_PASSCODE สำหรับเข้าสู่ระบบเจ้าของร้าน"],
    ] as const) {
      for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`/owner/login?error=${error}`);

        const errorMessage = page.getByText(message, { exact: true });
        await expect(errorMessage).toBeVisible();
        const fit = await errorMessage.evaluate((element) => {
          const text = element.getBoundingClientRect();
          const card = element.closest(".bqa-owner-login-card-v2")?.getBoundingClientRect();
          return { textRight: text.right, textBottom: text.bottom, cardRight: card?.right ?? 0, cardBottom: card?.bottom ?? 0 };
        });
        expect(fit.textRight).toBeLessThanOrEqual(fit.cardRight + 1);
        expect(fit.textBottom).toBeLessThanOrEqual(fit.cardBottom + 1);
        const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
        expect(width.scroll).toBe(width.client);
      }
    }

    await page.goto("/owner/login?error=rate-limited");
    const passcode = page.getByLabel("รหัสเจ้าของร้าน");
    await expect(passcode).toHaveAttribute("aria-invalid", "true");
    await expect(passcode).toHaveAttribute("aria-describedby", "passcode-error");
    await expect(passcode).toHaveAttribute("aria-errormessage", "passcode-error");
  });

  test("keeps keyboard order and visible focus on the authentication task", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/login");

    await page.keyboard.press("Tab");
    const passcode = page.getByLabel("รหัสเจ้าของร้าน");
    await expect(passcode).toBeFocused();
    await expect(passcode).toHaveCSS("outline-color", "rgb(61, 95, 204)");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeFocused();
  });
});
