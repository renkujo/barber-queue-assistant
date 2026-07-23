import { createHmac, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import {
  cleanupE2eQueueItems,
  e2eCustomerPrefix,
  getDatabaseUrl,
  getE2eOpenHoursAroundNow,
  skipWhenE2eEnvMissing,
} from "./helpers";

const getTodayDateKey = () => {
  const date = new Date();
  const dateValue = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
  return new Date(`${dateValue}T00:00:00+07:00`).toISOString().slice(0, 19).replace("T", " ");
};

const getClosedHoursAroundNow = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0) % 24;
  return hour < 12 ? { open: "12:00", close: "24:00" } : { open: "00:00", close: "12:00" };
};

type SettingsSnapshot = {
  id: string;
  businessHours: unknown;
  queueIntakeEnabled: boolean;
  bookingEnabled: boolean;
  walkInEnabled: boolean;
};

type DateSnapshot = {
  bookingEnabled: boolean;
  walkInEnabled: boolean;
  inStoreOnly: boolean;
  reason: string | null;
} | undefined;

const setDateMode = async (client: Client, date: string, mode: "online" | "in-store-only", reason: string) => {
  const online = mode === "online";
  await client.query(
    `insert into "ShopDateAvailability" ("id","date","bookingEnabled","walkInEnabled","inStoreOnly","reason","createdAt","updatedAt")
     values ($1,$2,$3,$3,$4,$5,now(),now())
     on conflict ("date") do update set "bookingEnabled"=$3,"walkInEnabled"=$3,"inStoreOnly"=$4,"reason"=$5,"updatedAt"=now()`,
    [randomUUID(), date, online, !online, reason],
  );
};

const prepareOpenWalkIn = async (client: Client) => {
  const settingsResult = await client.query<SettingsSnapshot>(
    `select "id","businessHours","queueIntakeEnabled","bookingEnabled","walkInEnabled" from "ShopSettings" order by "createdAt" asc limit 1`,
  );
  const settings = settingsResult.rows[0];
  const date = getTodayDateKey();
  const dateResult = await client.query<Exclude<DateSnapshot, undefined>>(
    `select "bookingEnabled","walkInEnabled","inStoreOnly","reason" from "ShopDateAvailability" where "date"=$1`,
    [date],
  );
  const dateSnapshot = dateResult.rows[0];
  await client.query(
    `update "ShopSettings" set "businessHours"=$1::jsonb,"queueIntakeEnabled"=true,"bookingEnabled"=true,"walkInEnabled"=true where "id"=$2`,
    [JSON.stringify(getE2eOpenHoursAroundNow()), settings.id],
  );
  await setDateMode(client, date, "online", "PW walk-in online");

  return { date, dateSnapshot, settings };
};

const restoreWalkInState = async (client: Client, state: Awaited<ReturnType<typeof prepareOpenWalkIn>>) => {
  await client.query(
    `update "ShopSettings" set "businessHours"=$1::jsonb,"queueIntakeEnabled"=$2,"bookingEnabled"=$3,"walkInEnabled"=$4 where "id"=$5`,
    [JSON.stringify(state.settings.businessHours), state.settings.queueIntakeEnabled, state.settings.bookingEnabled, state.settings.walkInEnabled, state.settings.id],
  );
  if (state.dateSnapshot) {
    await client.query(
      `update "ShopDateAvailability" set "bookingEnabled"=$1,"walkInEnabled"=$2,"inStoreOnly"=$3,"reason"=$4,"updatedAt"=now() where "date"=$5`,
      [state.dateSnapshot.bookingEnabled, state.dateSnapshot.walkInEnabled, state.dateSnapshot.inStoreOnly, state.dateSnapshot.reason, state.date],
    );
  } else {
    await client.query(`delete from "ShopDateAvailability" where "date"=$1`, [state.date]);
  }
};

const lineIdentityCookieName = "bqa_line_entry_walk_in";

const createLineIdentityCookie = (lineUserId: string) => {
  const secret = process.env.BARBER_ADMIN_SESSION_SECRET?.trim();
  expect(secret).toBeTruthy();
  const payload = Buffer.from(JSON.stringify({ lineUserId, purpose: "walk-in", expiresAt: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret ?? "")
    .update(`line-entry-identity:v1:${payload}`)
    .digest("base64url");
  return `${payload}.${signature}`;
};

test.describe("customer walk-in V2 responsive ownership", () => {
  test.beforeEach(() => {
    skipWhenE2eEnvMissing();
  });

  test("keeps the live queue form and status rail contained across breakpoints", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const state = await prepareOpenWalkIn(client);

    try {
      for (const viewport of [
        { width: 360, height: 800, rail: false },
        { width: 390, height: 844, rail: false },
        { width: 559, height: 900, rail: false },
        { width: 560, height: 900, rail: false },
        { width: 759, height: 900, rail: false },
        { width: 760, height: 900, rail: true },
        { width: 768, height: 1024, rail: true },
        { width: 1024, height: 768, rail: true },
        { width: 1440, height: 1000, rail: true },
      ]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto("/walk-in");
        await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-walkin-v2")).toBeVisible();
        await expect(page.locator("main[data-owner-visual]")).toHaveCount(0);
        const expectedPrimaryHeight = viewport.width < 760 ? 48 : 44;
        await expect(page.getByRole("button", { name: "รับบัตรคิวออนไลน์" })).toHaveCSS("min-height", `${expectedPrimaryHeight}px`);

        const guide = await page.locator(".bqa-walk-in-guide").boundingBox();
        const form = await page.locator(".bqa-book-form").boundingBox();
        if (viewport.rail) {
          expect(guide?.x ?? 0).toBeGreaterThan((form?.x ?? 0) + (form?.width ?? 0));
        } else {
          expect(guide?.y ?? 0).toBeLessThan(form?.y ?? 0);
        }
        const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
        expect(width.scroll).toBe(width.client);
      }

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/walk-in");
      await page.getByRole("combobox", { name: "บริการ", exact: true }).click();
      await expect(page.locator(".qw-v2-select-content")).toBeVisible();
    } finally {
      await restoreWalkInState(client, state);
      await client.end();
    }
  });

  test("represents closed, outside-hours, in-store-only and no-service states", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const state = await prepareOpenWalkIn(client);
    const services = await client.query<{ id: string; isActive: boolean }>(`select "id","isActive" from "Service"`);

    try {
      await client.query(`update "ShopSettings" set "queueIntakeEnabled"=false where "id"=$1`, [state.settings.id]);
      await page.goto("/walk-in");
      await expect(page.getByText("วันนี้ปิดรับบัตรคิวออนไลน์ กรุณากลับมาเช็คใหม่ภายหลัง")).toBeVisible();
      await expect(page.getByRole("button", { name: "รับบัตรคิวออนไลน์" })).toBeDisabled();

      await client.query(
        `update "ShopSettings" set "queueIntakeEnabled"=true,"businessHours"=$1::jsonb where "id"=$2`,
        [JSON.stringify(getClosedHoursAroundNow()), state.settings.id],
      );
      await page.goto("/walk-in");
      await expect(page.getByText(/ตอนนี้อยู่นอกเวลาเปิดร้าน/)).toBeVisible();
      await expect(page.getByRole("button", { name: "รับบัตรคิวออนไลน์" })).toBeDisabled();

      await client.query(`update "ShopSettings" set "businessHours"=$1::jsonb where "id"=$2`, [JSON.stringify(getE2eOpenHoursAroundNow()), state.settings.id]);
      await setDateMode(client, state.date, "in-store-only", "PW walk-in in-store only");
      await page.goto("/walk-in");
      await expect(page.getByRole("heading", { name: "เข้ามาที่ร้านได้เลย" })).toBeVisible();
      await expect(page.locator("form.bqa-book-form")).toHaveCount(0);

      await client.query(`update "ShopSettings" set "businessHours"=$1::jsonb where "id"=$2`, [JSON.stringify(getClosedHoursAroundNow()), state.settings.id]);
      await page.goto("/walk-in");
      await expect(page.getByText(/ตอนนี้อยู่นอกเวลาเปิดร้าน/)).toBeVisible();
      await expect(page.getByRole("heading", { name: "เข้ามาที่ร้านได้เลย" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "รับบัตรคิวออนไลน์" })).toBeDisabled();

      await setDateMode(client, state.date, "online", "PW walk-in online no services");
      await client.query(`update "ShopSettings" set "businessHours"=$1::jsonb where "id"=$2`, [JSON.stringify(getE2eOpenHoursAroundNow()), state.settings.id]);
      await client.query(`update "Service" set "isActive"=false`);
      await page.goto("/walk-in");
      await expect(page.getByText("ยังไม่มีบริการที่เปิดใช้ ตอนนี้ยังรับคิวจากลูกค้าไม่ได้")).toBeVisible();
      await expect(page.getByRole("button", { name: "รับบัตรคิวออนไลน์" })).toBeDisabled();
    } finally {
      for (const service of services.rows) {
        await client.query(`update "Service" set "isActive"=$1 where "id"=$2`, [service.isActive, service.id]);
      }
      await restoreWalkInState(client, state);
      await client.end();
    }
  });

  test("preserves form and verified LINE identity across an error retry", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const state = await prepareOpenWalkIn(client);
    const customerName = `${e2eCustomerPrefix} Walk-in retry ${Date.now()}`;
    const lineUserId = "U-walk-in-retry-v2";
    await cleanupE2eQueueItems();
    await client.query(`delete from "RateLimitBucket" where "key" like 'public-walk-in:%'`);

    try {
      await page.context().addCookies([{
        name: lineIdentityCookieName,
        value: createLineIdentityCookie(lineUserId),
        url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
        httpOnly: true,
        sameSite: "Lax",
      }]);
      await page.goto("/walk-in");
      await expect(page.getByRole("combobox", { name: "บริการ", exact: true })).toHaveText(/.+/);
      const serviceBefore = await page.getByRole("combobox", { name: "บริการ", exact: true }).innerText();
      await page.getByLabel("ชื่อ", { exact: true }).fill(customerName);
      await page.getByLabel("เบอร์โทร (ไม่บังคับ)").fill("invalid-phone!");
      await page.getByLabel("หมายเหตุ").fill("ข้อมูล walk-in ต้องไม่หายหลัง error");
      await page.getByRole("button", { name: "รับบัตรคิวออนไลน์" }).click();

      await expect(page.getByRole("alert").filter({ hasText: "กรอกข้อมูลไม่ครบ" })).toBeVisible();
      await expect(page).toHaveURL(/\/walk-in$/);
      await expect(page.getByRole("combobox", { name: "บริการ", exact: true })).toHaveText(serviceBefore);
      await expect(page.getByLabel("ชื่อ", { exact: true })).toHaveValue(customerName);
      await expect(page.getByLabel("เบอร์โทร (ไม่บังคับ)")).toHaveValue("invalid-phone!");
      await expect(page.getByLabel("หมายเหตุ")).toHaveValue("ข้อมูล walk-in ต้องไม่หายหลัง error");
      expect((await page.context().cookies()).some((cookie) => cookie.name === lineIdentityCookieName)).toBe(true);

      await page.getByLabel("เบอร์โทร (ไม่บังคับ)").fill("");
      await page.getByRole("button", { name: "รับบัตรคิวออนไลน์" }).click();
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
      await restoreWalkInState(client, state);
      await client.end();
    }
  });

  test("keeps long service options and keyboard order accessible", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const state = await prepareOpenWalkIn(client);
    const serviceResult = await client.query<{ id: string; name: string }>(
      `select "id","name" from "Service" where "isActive"=true order by "sortOrder","createdAt" limit 1`,
    );
    const service = serviceResult.rows[0];
    const longName = "ตัดผมพร้อมสระและออกแบบทรงสำหรับลูกค้า walk-in ที่ต้องการรายละเอียดเฉพาะบุคคล";

    try {
      await client.query(`update "Service" set "name"=$1 where "id"=$2`, [longName, service.id]);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto("/walk-in");
      const serviceTrigger = page.getByRole("combobox", { name: "บริการ", exact: true });
      await serviceTrigger.click();
      const option = page.getByRole("option").filter({ hasText: longName });
      await expect(option).toBeVisible();
      expect((await option.boundingBox())?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(328);
      await page.keyboard.press("Escape");
      await expect(serviceTrigger).toBeFocused();

      await page.goto("/walk-in");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "กลับ" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("combobox", { name: "บริการ", exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("ชื่อ", { exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("เบอร์โทร (ไม่บังคับ)")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("หมายเหตุ")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "ประกาศความเป็นส่วนตัว" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "รับบัตรคิวออนไลน์" })).toBeFocused();
    } finally {
      await client.query(`update "Service" set "name"=$1 where "id"=$2`, [service.name, service.id]);
      await restoreWalkInState(client, state);
      await client.end();
    }
  });

  test("uses one authoritative inline error for legacy error URLs", async ({ page }) => {
    await page.goto("/walk-in?error=invalid");

    const error = page.getByRole("alert").filter({ hasText: "กรอกข้อมูลไม่ครบ" });
    await expect(error).toHaveCount(1);
    await expect(error).toBeVisible();
    await expect(page.locator(".bqa-toast")).toHaveCount(0);
  });
});
