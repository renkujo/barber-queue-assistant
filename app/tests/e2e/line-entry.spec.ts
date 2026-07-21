import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const createOwnerIdentityCookie = () => {
  const secret = process.env.BARBER_ADMIN_SESSION_SECRET?.trim();
  expect(secret).toBeTruthy();
  const payload = Buffer.from(JSON.stringify({
    lineUserId: "U-owner-purpose-test",
    purpose: "owner",
    expiresAt: Date.now() + 10 * 60 * 1000,
  })).toString("base64url");
  const signature = createHmac("sha256", secret ?? "")
    .update(`line-entry-identity:v1:${payload}`)
    .digest("base64url");
  return `${payload}.${signature}`;
};

test.describe("LINE entry route", () => {
  test("shows booking fallback entry when opened outside LIFF", async ({ page }) => {
    await page.goto("/line?target=book");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: จองเวลา" })).toHaveAttribute("href", "/book");
    await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-line-v2")).toBeVisible();
    await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);
  });


  test("uses LIFF state target when opened through liff.line.me", async ({ page }) => {
    await page.goto("/line?liff.state=%3Ftarget%3Dbook");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: จองเวลา" })).toHaveAttribute("href", "/book");
  });

  test("supports queue-status target fallback", async ({ page }) => {
    await page.goto("/line?target=queue-status");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: เช็คคิว" })).toHaveAttribute("href", "/#queue-status");
  });


  test("supports owner LIFF target fallback", async ({ page }) => {
    await page.goto("/line?target=owner&token=test-token");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "กลับหน้าตั้งค่า" })).toHaveAttribute("href", "/owner/settings");
    await expect(page.getByRole("link", { name: "กลับคิววันนี้" })).toHaveAttribute("href", "/owner");

    await page.goto("/line/owner");
    await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-line-v2.bqa-owner-line-status-v2")).toBeVisible();
    await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);
  });

  test("uses owner LIFF state target fallback", async ({ page }) => {
    await page.goto("/line?liff.state=%3Ftarget%3Downer%26token%3Dstate-token");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "กลับหน้าตั้งค่า" })).toHaveAttribute("href", "/owner/settings");
  });

  test("clears a purpose-bound owner identity after a failed completion", async ({ page }) => {
    await page.context().addCookies([{
      name: "bqa_line_entry_owner",
      value: createOwnerIdentityCookie(),
      url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
    }]);

    await page.goto("/line/owner/complete?token=invalid-token");
    await expect(page).toHaveURL(/\/line\/owner\?result=/);
    await expect(page.getByText("ลิงก์เชื่อม LINE หมดอายุหรือไม่ถูกต้อง")).toBeVisible();
    expect((await page.context().cookies()).some((cookie) => cookie.name === "bqa_line_entry_owner")).toBe(false);
  });

  test("shows walk-in fallback entry by default", async ({ page }) => {
    await page.goto("/line");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: รับบัตรคิวออนไลน์" })).toHaveAttribute("href", "/walk-in");
  });

  test("falls back safely when LIFF state is malformed", async ({ page }) => {
    const response = await page.goto("/line?liff.state=%25");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: รับบัตรคิวออนไลน์" })).toHaveAttribute("href", "/walk-in");
  });
});
