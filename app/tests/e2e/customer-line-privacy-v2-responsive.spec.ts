import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { skipWhenE2eEnvMissing } from "./helpers";

const createOwnerResult = (status: "connected" | "invalid" | "missing-line") => {
  const secret = process.env.BARBER_ADMIN_SESSION_SECRET?.trim();
  expect(secret).toBeTruthy();
  const payload = `${status}.${Date.now() + 2 * 60 * 1000}`;
  const signature = createHmac("sha256", secret ?? "").update(`owner-line-result:v1:${payload}`).digest("hex");
  return `${payload}.${signature}`;
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(width.scroll).toBe(width.client);
};

test.describe("customer LINE and privacy V2 responsive ownership", () => {
  test.beforeEach(() => {
    skipWhenE2eEnvMissing();
  });

  test("keeps LINE state, long target action and card gaps contained", async ({ page }) => {
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
      await page.goto("/line?target=owner&token=test-owner-token");
      await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-line-v2")).toBeVisible();
      const linePanel = page.locator(".bqa-line-entry-panel");
      const linePanelClass = await linePanel.getAttribute("class");
      if (linePanelClass?.includes("--error")) {
        await expect(linePanel).toHaveAttribute("role", "alert");
        await expect(linePanel).toHaveAttribute("aria-live", "assertive");
      } else {
        await expect(linePanel).toHaveAttribute("role", "status");
        await expect(linePanel).toHaveAttribute("aria-live", "polite");
      }

      const header = await page.locator(".bqa-line-card > .bqa-page-header").boundingBox();
      const entry = await page.locator(".bqa-line-card > .bqa-line-entry").boundingBox();
      expect((entry?.y ?? 0) - ((header?.y ?? 0) + (header?.height ?? 0))).toBeGreaterThanOrEqual(12);
      const panel = await page.locator(".bqa-line-entry-panel").boundingBox();
      const actions = await page.locator(".bqa-line-entry .bqa-button-pair").boundingBox();
      expect((actions?.y ?? 0) - ((panel?.y ?? 0) + (panel?.height ?? 0))).toBeGreaterThanOrEqual(12);

      const buttons = await page.locator(".bqa-line-entry .bqa-button-pair .ui-button").all();
      const first = await buttons[0].boundingBox();
      const second = await buttons[1].boundingBox();
      expect((second?.y ?? 0) - ((first?.y ?? 0) + (first?.height ?? 0))).toBeGreaterThanOrEqual(8);
      await expect(page.getByRole("link", { name: "กลับหน้าตั้งค่า" })).toHaveAttribute("href", "/owner/settings");

      const textFit = await page.locator(".bqa-line-entry-panel > div:last-child").evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      }));
      expect(textFit.scrollWidth).toBeLessThanOrEqual(textFit.clientWidth + 1);
      expect(textFit.scrollHeight).toBeLessThanOrEqual(textFit.clientHeight + 1);
      await expectNoHorizontalOverflow(page);
    }

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "กลับหน้าตั้งค่า" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "กลับคิววันนี้" })).toBeFocused();
  });

  test("renders connecting state safely without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      for (const viewport of [
        { width: 360, height: 800 },
        { width: 390, height: 844 },
        { width: 760, height: 900 },
        { width: 768, height: 1024 },
        { width: 1440, height: 1000 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(`${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"}/line?target=book`);
        const state = page.getByRole("status");
        await expect(state).toContainText("กำลังเปิด LINE เพื่อเชื่อมคิวของคุณ");
        await expect(state).toHaveAttribute("aria-busy", "true");
        await expectNoHorizontalOverflow(page);
      }
    } finally {
      await context.close();
    }
  });

  test("requires signed owner completion status and preserves semantic state", async ({ page }) => {
    for (const [status, text, toneClass, liveRole] of [
      ["connected", "เชื่อม LINE เจ้าของร้านเรียบร้อยแล้ว", "bqa-owner-line-notice--connected", "status"],
      ["invalid", "ลิงก์เชื่อม LINE หมดอายุหรือไม่ถูกต้อง", "bqa-owner-line-notice--invalid", "alert"],
      ["missing-line", "เปิดลิงก์นี้ผ่าน LINE", "bqa-owner-line-notice--missing-line", "status"],
    ] as const) {
      for (const viewport of [
        { width: 360, height: 800 },
        { width: 390, height: 844 },
        { width: 760, height: 900 },
        { width: 768, height: 1024 },
        { width: 1440, height: 1000 },
      ]) {
        await page.setViewportSize(viewport);
        const query = status === "missing-line" ? "" : `?result=${encodeURIComponent(createOwnerResult(status))}`;
        await page.goto(`/line/owner${query}`);
        await expect(page.locator("main[data-customer-visual='v2'].bqa-owner-line-status-v2")).toBeVisible();
        const notice = page.getByRole(liveRole).filter({ hasText: text });
        await expect(notice).toBeVisible();
        await expect(notice).toHaveClass(new RegExp(toneClass));
        const statusBlocks = await Promise.all([
          page.locator(".bqa-line-card > .bqa-page-header").boundingBox(),
          notice.boundingBox(),
          page.locator(".bqa-line-card > .bqa-button-pair").boundingBox(),
        ]);
        for (let index = 1; index < statusBlocks.length; index += 1) {
          const previous = statusBlocks[index - 1];
          const current = statusBlocks[index];
          expect((current?.y ?? 0) - ((previous?.y ?? 0) + (previous?.height ?? 0))).toBeGreaterThanOrEqual(12);
        }
        await expectNoHorizontalOverflow(page);
      }
    }

    await page.goto("/line/owner?status=connected");
    await expect(page.getByRole("status").filter({ hasText: "เปิดลิงก์นี้ผ่าน LINE" })).toBeVisible();
    await expect(page.getByText("เชื่อม LINE เจ้าของร้านเรียบร้อยแล้ว")).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "กลับหน้าตั้งค่า" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "กลับคิววันนี้" })).toBeFocused();
  });

  test("keeps privacy panels separated and long Thai disclosure inside card bounds", async ({ page }) => {
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
      await page.goto("/privacy");
      await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-privacy-v2")).toBeVisible();
      await expect(page.getByRole("heading", { name: "ประกาศความเป็นส่วนตัว" })).toBeVisible();

      const directBlocks = await page.locator(".bqa-privacy-card > .bqa-page-header, .bqa-privacy-card > .bqa-notice, .bqa-privacy-card > .bqa-panel, .bqa-privacy-card > .bqa-privacy-note").all();
      const boxes = await Promise.all(directBlocks.map((block) => block.boundingBox()));
      for (let index = 1; index < boxes.length; index += 1) {
        const previous = boxes[index - 1];
        const current = boxes[index];
        expect((current?.y ?? 0) - ((previous?.y ?? 0) + (previous?.height ?? 0))).toBeGreaterThanOrEqual(12);
      }

      const longDisclosure = page.getByText(/คุกกี้ HttpOnly ที่ลงลายเซ็นและแยกตามวัตถุประสงค์/);
      await expect(longDisclosure).toBeVisible();
      const fit = await longDisclosure.evaluate((element) => {
        const text = element.getBoundingClientRect();
        const panel = element.closest(".bqa-panel")?.getBoundingClientRect();
        return {
          textRight: text.right,
          textBottom: text.bottom,
          panelRight: panel?.right ?? 0,
          panelBottom: panel?.bottom ?? 0,
        };
      });
      expect(fit.textRight).toBeLessThanOrEqual(fit.panelRight + 1);
      expect(fit.textBottom).toBeLessThanOrEqual(fit.panelBottom + 1);
      await expectNoHorizontalOverflow(page);
    }

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "กลับ" })).toBeFocused();
  });
});
