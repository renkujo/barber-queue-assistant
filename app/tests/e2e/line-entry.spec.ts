import { expect, test } from "@playwright/test";

test.describe("LINE entry route", () => {
  test("shows booking fallback entry when opened outside LIFF", async ({ page }) => {
    await page.goto("/line?target=book");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: จองเวลา" })).toHaveAttribute("href", "/book");
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
    await expect(page.getByRole("link", { name: "ไปต่อ: เชื่อม LINE เจ้าของร้าน" })).toHaveAttribute("href", "/line/owner?token=test-token");
  });

  test("uses owner LIFF state target fallback", async ({ page }) => {
    await page.goto("/line?liff.state=%3Ftarget%3Downer%26token%3Dstate-token");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: เชื่อม LINE เจ้าของร้าน" })).toHaveAttribute("href", "/line/owner?token=state-token");
  });

  test("shows walk-in fallback entry by default", async ({ page }) => {
    await page.goto("/line");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: รับบัตรคิวออนไลน์" })).toHaveAttribute("href", "/walk-in");
  });
});
