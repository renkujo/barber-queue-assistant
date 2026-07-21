import { expect, test } from "@playwright/test";

test.describe("responsive UI rendering", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("customer entry has visible icons and no horizontal overflow", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-home-v2")).toBeVisible();
    await expect(page.getByRole("heading", { name: "จองคิวตัดผม" })).toBeVisible();
    await expect(page.locator(".bqa-page-image")).toHaveAttribute("src", /(?:%2F|\/)icon\.png/);
    await expect(page.locator(".bqa-home-actions svg")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "เช็คสถานะคิว" })).toHaveCSS("min-height", "48px");

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  });

  test("booking selects expose their current values and options", async ({ page }) => {
    await page.goto("/book");

    const serviceSelect = page.getByRole("combobox", { name: "บริการ" });
    const dateSelect = page.getByRole("combobox", { name: "วัน" });
    const timeSelect = page.getByRole("combobox", { name: "เวลา" });

    await expect(serviceSelect).not.toHaveText("");
    await expect(dateSelect).not.toHaveText("");
    await expect(timeSelect).not.toHaveText("");

    await serviceSelect.click();
    await expect(page.locator(".qw-v2-select-content")).toBeVisible();
    await expect(page.getByRole("option").first()).toBeVisible();
  });

  test("web icon metadata exposes browser, Apple, and installable PWA assets", async ({ page, request }) => {
    await page.goto("/");

    await expect(page.locator('link[rel="icon"][sizes="512x512"]')).toHaveAttribute("href", /icon\.png/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", /apple-icon\.png/);
    await expect(page.locator('link[rel="icon"][href*="favicon.ico"]')).toHaveAttribute("href", /favicon\.ico/);

    const manifestResponse = await request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBe(true);

    const manifest = await manifestResponse.json();
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192", purpose: "any" }),
      expect.objectContaining({ src: "/icon.png", sizes: "512x512", purpose: "any" }),
      expect.objectContaining({ src: "/icons/icon-maskable-512.png", sizes: "512x512", purpose: "maskable" }),
    ]));

    for (const iconPath of ["/favicon.ico", "/apple-icon.png", "/icons/icon-192.png", "/icon.png", "/icons/icon-maskable-512.png"]) {
      const response = await request.get(iconPath);
      expect(response.ok(), `${iconPath} should load`).toBe(true);
      expect(response.headers()["content-type"]).toMatch(/^image\//);
    }
  });
});
