import { expect, test } from "@playwright/test";

test.describe("LINE entry route", () => {
  test("shows booking fallback entry when opened outside LIFF", async ({ page }) => {
    await page.goto("/line?target=book");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: จองเวลา" })).toHaveAttribute("href", "/book");
  });

  test("shows walk-in fallback entry by default", async ({ page }) => {
    await page.goto("/line");

    await expect(page.getByRole("heading", { name: "เชื่อม LINE เพื่อรับแจ้งเตือน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ไปต่อ: รับคิววันนี้" })).toHaveAttribute("href", "/walk-in");
  });
});
