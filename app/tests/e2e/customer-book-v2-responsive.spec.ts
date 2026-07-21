import { expect, test } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import { Client } from "pg";
import { cleanupE2eQueueItems, e2eCustomerPrefix, getDatabaseUrl, skipWhenE2eEnvMissing } from "./helpers";

const getDateValue = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateStart = (dateValue: string) => new Date(`${dateValue}T00:00:00+07:00`).toISOString().slice(0, 19).replace("T", " ");

type DateAvailabilityRow = {
  id: string;
  date: Date;
  bookingEnabled: boolean;
  walkInEnabled: boolean;
  inStoreOnly: boolean;
  reason: string | null;
};

type DateAvailabilitySnapshot = DateAvailabilityRow | undefined;

const setDateAvailability = async (client: Client, date: string, mode: "booking-and-walk-in" | "closed", reason: string) => {
  const enabled = mode === "booking-and-walk-in";
  await client.query(
    `insert into "ShopDateAvailability" ("id","date","bookingEnabled","walkInEnabled","inStoreOnly","reason","createdAt","updatedAt")
     values ($1,$2,$3,$3,false,$4,now(),now())
     on conflict ("date") do update set "bookingEnabled"=$3,"walkInEnabled"=$3,"inStoreOnly"=false,"reason"=$4,"updatedAt"=now()`,
    [randomUUID(), date, enabled, reason],
  );
};

const restoreDateAvailability = async (client: Client, date: string, original: DateAvailabilitySnapshot) => {
  if (original) {
    await client.query(
      `update "ShopDateAvailability" set "bookingEnabled"=$1,"walkInEnabled"=$2,"inStoreOnly"=$3,"reason"=$4,"updatedAt"=now() where "date"=$5`,
      [original.bookingEnabled, original.walkInEnabled, original.inStoreOnly, original.reason, date],
    );
  } else {
    await client.query(`delete from "ShopDateAvailability" where "date"=$1`, [date]);
  }
};

const lineIdentityCookieName = "bqa_line_entry_book";

const createLineIdentityCookie = (lineUserId: string) => {
  const secret = process.env.BARBER_ADMIN_SESSION_SECRET?.trim();
  expect(secret).toBeTruthy();
  const payload = Buffer.from(JSON.stringify({ lineUserId, purpose: "book", expiresAt: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret ?? "")
    .update(`line-entry-identity:v1:${payload}`)
    .digest("base64url");
  return `${payload}.${signature}`;
};

test.describe("customer booking V2 responsive ownership", () => {
  test.beforeEach(() => {
    skipWhenE2eEnvMissing();
  });

  test("keeps the booking form, portal scope and guide ownership contained", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 800, rail: false },
      { width: 390, height: 844, rail: false },
      { width: 559, height: 900, rail: false },
      { width: 560, height: 900, rail: false },
      { width: 759, height: 900, rail: false },
      { width: 760, height: 900, rail: true },
      { width: 1024, height: 768, rail: true },
      { width: 1440, height: 1000, rail: true },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/book");

      await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-book-v2")).toBeVisible();
      await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);
      await expect(page.locator('input[name="lineUserId"]')).toHaveCount(0);
      await expect(page).not.toHaveURL(/lineUserId/);
      await expect(page.getByRole("button", { name: "ยืนยันคิว" })).toHaveCSS("min-height", "52px");

      const guide = await page.locator(".bqa-book-guide").boundingBox();
      const form = await page.locator(".bqa-book-form").boundingBox();
      if (viewport.rail) {
        expect(guide?.x ?? 0).toBeGreaterThan((form?.x ?? 0) + (form?.width ?? 0));
      } else {
        expect(guide?.y ?? 0).toBeLessThan(form?.y ?? 0);
      }

      const controlHeights = await page.locator(".bqa-book-section .ui-input, .bqa-book-section .ui-select-trigger").evaluateAll((controls) =>
        controls.map((control) => control.getBoundingClientRect().height),
      );
      expect(Math.min(...controlHeights)).toBeGreaterThanOrEqual(48);

      const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(width.scroll).toBe(width.client);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/book");
    for (const label of ["บริการ", "วัน", "เวลา"]) {
      await page.getByRole("combobox", { name: label, exact: true }).click();
      await expect(page.locator(".qw-v2-select-content")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator(".qw-v2-select-content")).toBeHidden();
    }
  });

  test("keeps the submit action disabled when global booking intake is closed", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const original = await client.query<{ id: string; queueIntakeEnabled: boolean }>(
      `select "id", "queueIntakeEnabled" from "ShopSettings" order by "createdAt" asc limit 1`,
    );
    const settings = original.rows[0];

    try {
      await client.query(`update "ShopSettings" set "queueIntakeEnabled"=false where "id"=$1`, [settings.id]);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/book");

      await expect(page.getByText("ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว เจ้าของร้านจะเปิดรับอีกครั้งเมื่อพร้อม")).toBeVisible();
      await expect(page.getByRole("button", { name: "ยืนยันคิว" })).toBeDisabled();
    } finally {
      await client.query(`update "ShopSettings" set "queueIntakeEnabled"=$1 where "id"=$2`, [settings.queueIntakeEnabled, settings.id]);
      await client.end();
    }
  });

  test("keeps long service labels readable in the portaled Select", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const original = await client.query<{ id: string; name: string }>(
      `select "id", "name" from "Service" where "isActive"=true order by "sortOrder" asc, "createdAt" asc limit 1`,
    );
    const service = original.rows[0];
    const longName = "ตัดผมพร้อมสระและออกแบบทรงสุภาพสำหรับลูกค้าที่ต้องการรายละเอียดเฉพาะบุคคล";

    try {
      await client.query(`update "Service" set "name"=$1 where "id"=$2`, [longName, service.id]);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto("/book");
      await page.getByLabel("บริการ").click();

      const option = page.getByRole("option").filter({ hasText: longName });
      await expect(option).toBeVisible();
      await expect(option).toContainText(longName);
      await expect(page.locator(".qw-v2-select-content")).toBeVisible();
      const optionBox = await option.boundingBox();
      expect(optionBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(328);
      const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(width.scroll).toBe(width.client);
    } finally {
      await client.query(`update "Service" set "name"=$1 where "id"=$2`, [service.name, service.id]);
      await client.end();
    }
  });

  test("keeps the keyboard path in task order", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/book");

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "กลับ" })).toBeFocused();
    await page.keyboard.press("Tab");
    const service = page.getByRole("combobox", { name: "บริการ", exact: true });
    await expect(service).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".qw-v2-select-content")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(service).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("combobox", { name: "วัน", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("combobox", { name: "เวลา", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("ชื่อ", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("เบอร์โทร (ไม่บังคับ)")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("หมายเหตุ")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "ประกาศความเป็นส่วนตัว" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "ยืนยันคิว" })).toBeFocused();
  });

  test("keeps unavailable dates empty and allows tomorrow when today is closed", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const todayDate = getDateStart(getDateValue());
    const tomorrowDate = getDateStart(getDateValue(1));
    const [todayOriginal, tomorrowOriginal] = await Promise.all([
      client.query<DateAvailabilityRow>(`select "id","date","bookingEnabled","walkInEnabled","inStoreOnly","reason" from "ShopDateAvailability" where "date"=$1`, [todayDate]),
      client.query<DateAvailabilityRow>(`select "id","date","bookingEnabled","walkInEnabled","inStoreOnly","reason" from "ShopDateAvailability" where "date"=$1`, [tomorrowDate]),
    ]);

    try {
      await setDateAvailability(client, todayDate, "closed", "PW booking today closed");
      await setDateAvailability(client, tomorrowDate, "closed", "PW booking tomorrow closed");
      await page.goto("/book");

      await expect(page.getByRole("combobox", { name: "เวลา", exact: true })).toContainText("เลือกเวลา");
      await expect(page.getByRole("button", { name: "ยืนยันคิว" })).toBeDisabled();
      await page.getByRole("combobox", { name: "เวลา", exact: true }).click();
      const disabledOptions = page.locator(".qw-v2-select-content .ui-select-item[data-disabled]");
      await expect(disabledOptions.first()).toBeVisible();
      expect(await disabledOptions.count()).toBeGreaterThan(0);
      await page.keyboard.press("Escape");

      await setDateAvailability(client, tomorrowDate, "booking-and-walk-in", "PW booking tomorrow open");
      await page.goto("/book");
      await expect(page.getByRole("combobox", { name: "วัน", exact: true })).toContainText("พรุ่งนี้");
      await expect(page.getByRole("combobox", { name: "เวลา", exact: true })).not.toContainText("เลือกเวลา");
      await expect(page.getByRole("button", { name: "ยืนยันคิว" })).toBeEnabled();
    } finally {
      await restoreDateAvailability(client, todayDate, todayOriginal.rows[0]);
      await restoreDateAvailability(client, tomorrowDate, tomorrowOriginal.rows[0]);
      await client.end();
    }
  });

  test("preserves form and LINE identity after an action error and successful retry", async ({ page }) => {
    const customerName = `${e2eCustomerPrefix} Booking retry ${Date.now()}`;
    const lineUserId = "U-booking-retry-v2";
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    await cleanupE2eQueueItems();
    await client.query(`delete from "RateLimitBucket" where "key" like 'public-booking:%'`);

    try {
      const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
      await page.context().addCookies([{
        name: lineIdentityCookieName,
        value: createLineIdentityCookie(lineUserId),
        url: baseURL,
        httpOnly: true,
        sameSite: "Lax",
      }]);
      await page.goto("/book");
      const serviceBefore = await page.getByRole("combobox", { name: "บริการ", exact: true }).innerText();
      const dateBefore = await page.getByRole("combobox", { name: "วัน", exact: true }).innerText();
      const timeBefore = await page.getByRole("combobox", { name: "เวลา", exact: true }).innerText();
      await page.getByLabel("ชื่อ", { exact: true }).fill(customerName);
      await page.getByLabel("เบอร์โทร (ไม่บังคับ)").fill("invalid-phone!");
      await page.getByLabel("หมายเหตุ").fill("ข้อมูลต้องอยู่หลัง action error");
      await page.getByRole("button", { name: "ยืนยันคิว" }).click();

      await expect(page.getByRole("alert").filter({ hasText: "กรอกข้อมูลไม่ครบ" })).toBeVisible();
      await expect(page).toHaveURL(/\/book$/);
      await expect(page.getByLabel("ชื่อ", { exact: true })).toHaveValue(customerName);
      await expect(page.getByLabel("เบอร์โทร (ไม่บังคับ)")).toHaveValue("invalid-phone!");
      await expect(page.getByLabel("หมายเหตุ")).toHaveValue("ข้อมูลต้องอยู่หลัง action error");
      await expect(page.locator('input[name="lineUserId"]')).toHaveCount(0);
      expect((await page.context().cookies()).some((cookie) => cookie.name === lineIdentityCookieName)).toBe(true);
      await expect(page.getByRole("combobox", { name: "บริการ", exact: true })).toHaveText(serviceBefore);
      await expect(page.getByRole("combobox", { name: "วัน", exact: true })).toHaveText(dateBefore);
      await expect(page.getByRole("combobox", { name: "เวลา", exact: true })).toHaveText(timeBefore);

      await page.getByLabel("เบอร์โทร (ไม่บังคับ)").fill("");
      await page.getByRole("button", { name: "ยืนยันคิว" }).click();
      await expect(page).toHaveURL(/\/queue\/[a-f0-9-]{36}$/);
      const created = await client.query<{ lineUserIdSnapshot: string | null; phoneSnapshot: string | null }>(
        `select "lineUserIdSnapshot","phoneSnapshot" from "QueueItem" where "customerNameSnapshot"=$1 order by "createdAt" desc limit 1`,
        [customerName],
      );
      expect(created.rows[0]?.lineUserIdSnapshot).toBe(lineUserId);
      expect(created.rows[0]?.phoneSnapshot).toBeNull();
      expect((await page.context().cookies()).some((cookie) => cookie.name === lineIdentityCookieName)).toBe(false);
    } finally {
      await cleanupE2eQueueItems();
      await client.end();
    }
  });
});
