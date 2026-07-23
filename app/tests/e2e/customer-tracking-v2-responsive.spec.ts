import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { getDatabaseUrl, skipWhenE2eEnvMissing } from "./helpers";

const statusCases = [
  ["CONFIRMED", "ยืนยันแล้ว", "ยืนยันคิวแล้ว", "ร้านได้รับคิวจองของคุณแล้ว", "ui-badge--neutral"],
  ["ARRIVED", "มาถึงแล้ว", "เช็กอินถึงร้านแล้ว", "ร้านรับทราบว่าคุณมาถึงแล้ว", "ui-badge--positive"],
  ["WAITING", "รออยู่", "กำลังรอเรียกคิว", "คิวของคุณอยู่ในรายการรอ", "ui-badge--neutral"],
  ["IN_PROGRESS", "กำลังตัด", "กำลังให้บริการ", "ถึงคิวของคุณแล้ว", "ui-badge--positive"],
  ["LATE", "มาสาย", "คิวนี้ถูกทำเครื่องหมายว่ามาสาย", "ให้รับบัตรคิวใหม่", "ui-badge--warning"],
  ["NO_SHOW", "ไม่มา", "คิวนี้ถูกบันทึกว่าไม่มา", "ให้รับบัตรคิวใหม่", "ui-badge--danger"],
  ["CANCELLED", "ยกเลิก", "คิวนี้ถูกยกเลิก", "ให้รับบัตรคิวใหม่", "ui-badge--danger"],
  ["DONE", "เสร็จแล้ว", "บริการเสร็จแล้ว", "ขอบคุณที่ใช้บริการ", "ui-badge--positive"],
] as const;

test.describe("customer tracking V2 privacy and responsive ownership", () => {
  test.beforeEach(() => {
    skipWhenE2eEnvMissing();
  });

  const createTrackingItem = async (client: Client) => {
    const id = `${randomUUID()}WMWMWM`;
    const publicToken = randomUUID();
    const service = await client.query<{ id: string }>(
      `select "id" from "Service" where "isActive"=true order by "sortOrder","createdAt" limit 1`,
    );
    const date = new Date();
    const dateValue = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
    const dateKey = new Date(`${dateValue}T00:00:00+07:00`).toISOString().slice(0, 19).replace("T", " ");
    await client.query(
      `insert into "QueueItem" (
        "id","publicToken","type","status","customerNameSnapshot","phoneSnapshot","lineUserIdSnapshot",
        "serviceId","serviceNameSnapshot","serviceDurationMinutes","date","estimatedAt","note","ownerNote","createdBy","createdAt","updatedAt"
      ) values ($1,$2,'WALK_IN','WAITING',$3,$4,$5,$6,$7,30,$8,now() + interval '30 minutes',$9,$10,'CUSTOMER',now(),now())`,
      [
        id,
        publicToken,
        "ลูกค้าชื่อยาวสำหรับตรวจ privacy boundary",
        "0899999999",
        "U-private-line-id",
        service.rows[0]?.id ?? null,
        "บริการตัดผมพร้อมสระและออกแบบทรงสุภาพแบบรายละเอียดพิเศษ",
        dateKey,
        "customer-private-note",
        "owner-private-note",
      ],
    );
    return { id, publicToken };
  };

  test("keeps ticket, PIN and long details contained without exposing private fields", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const item = await createTrackingItem(client);

    try {
      for (const viewport of [
        { width: 360, height: 800, rail: false, pairedActions: false },
        { width: 390, height: 844, rail: false, pairedActions: false },
        { width: 559, height: 900, rail: false, pairedActions: false },
        { width: 560, height: 900, rail: false, pairedActions: true },
        { width: 759, height: 900, rail: false, pairedActions: true },
        { width: 760, height: 900, rail: true, pairedActions: true },
        { width: 768, height: 1024, rail: true, pairedActions: true },
        { width: 1024, height: 768, rail: true, pairedActions: true },
        { width: 1440, height: 1000, rail: true, pairedActions: true },
      ]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`/queue/${item.publicToken}`);
        await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-tracking-v2")).toBeVisible();
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex.*nofollow/);
        await expect(page.locator(".bqa-tracking-access-pin")).toHaveText(/^\d{4}$/);

        const queueCodeFit = await page.locator(".bqa-tracking-ticket strong").evaluate((element) => {
          const code = element.getBoundingClientRect();
          const ticket = element.parentElement?.getBoundingClientRect();

          return {
            codeLeft: code.left,
            codeRight: code.right,
            ticketLeft: ticket?.left ?? 0,
            ticketRight: ticket?.right ?? 0,
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          };
        });
        expect(queueCodeFit.scrollWidth).toBeLessThanOrEqual(queueCodeFit.clientWidth + 1);
        expect(queueCodeFit.codeLeft).toBeGreaterThanOrEqual(queueCodeFit.ticketLeft - 1);
        expect(queueCodeFit.codeRight).toBeLessThanOrEqual(queueCodeFit.ticketRight + 1);

        const main = await page.locator(".bqa-tracking-main").boundingBox();
        const side = await page.locator(".bqa-tracking-side").boundingBox();
        if (viewport.rail) {
          expect(side?.x ?? 0).toBeGreaterThan((main?.x ?? 0) + (main?.width ?? 0));
          expect((side?.x ?? 0) - ((main?.x ?? 0) + (main?.width ?? 0))).toBeGreaterThanOrEqual(16);
        } else {
          expect(side?.y ?? 0).toBeGreaterThanOrEqual((main?.y ?? 0) + (main?.height ?? 0));
          expect((side?.y ?? 0) - ((main?.y ?? 0) + (main?.height ?? 0))).toBeGreaterThanOrEqual(12);
        }

        const mainSections = await Promise.all([
          page.locator(".bqa-tracking-ticket").boundingBox(),
          page.locator(".bqa-tracking-access").boundingBox(),
          page.locator(".bqa-tracking-message").boundingBox(),
        ]);
        for (let index = 1; index < mainSections.length; index += 1) {
          const previous = mainSections[index - 1];
          const current = mainSections[index];
          expect((current?.y ?? 0) - ((previous?.y ?? 0) + (previous?.height ?? 0))).toBeGreaterThanOrEqual(12);
        }

        const [firstAction, secondAction] = await page.locator(".bqa-tracking-actions .ui-button").all();
        const firstBox = await firstAction.boundingBox();
        const secondBox = await secondAction.boundingBox();
        if (viewport.pairedActions) {
          expect(secondBox?.x ?? 0).toBeGreaterThan((firstBox?.x ?? 0) + (firstBox?.width ?? 0));
          expect((secondBox?.x ?? 0) - ((firstBox?.x ?? 0) + (firstBox?.width ?? 0))).toBeGreaterThanOrEqual(8);
        } else {
          expect(secondBox?.y ?? 0).toBeGreaterThanOrEqual((firstBox?.y ?? 0) + (firstBox?.height ?? 0));
          expect((secondBox?.y ?? 0) - ((firstBox?.y ?? 0) + (firstBox?.height ?? 0))).toBeGreaterThanOrEqual(8);
        }

        const longServiceFit = await page.locator(".bqa-tracking-stat-grid .bqa-stat-tile").first().evaluate((element) => {
          const tile = element.getBoundingClientRect();
          const text = element.querySelector(".bqa-stat-text")?.getBoundingClientRect();
          return {
            tileRight: tile.right,
            tileBottom: tile.bottom,
            textRight: text?.right ?? 0,
            textBottom: text?.bottom ?? 0,
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          };
        });
        expect(longServiceFit.scrollWidth).toBeLessThanOrEqual(longServiceFit.clientWidth + 1);
        expect(longServiceFit.textRight).toBeLessThanOrEqual(longServiceFit.tileRight + 1);
        expect(longServiceFit.textBottom).toBeLessThanOrEqual(longServiceFit.tileBottom + 1);

        const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
        expect(width.scroll).toBe(width.client);
      }

      const bodyText = await page.locator("body").innerText();
      expect(bodyText).toContain("ลูก***");
      expect(bodyText).not.toContain(item.id);
      expect(bodyText).not.toContain(item.publicToken);
      expect(bodyText).not.toContain("0899999999");
      expect(bodyText).not.toContain("U-private-line-id");
      expect(bodyText).not.toContain("customer-private-note");
      expect(bodyText).not.toContain("owner-private-note");
    } finally {
      await client.query(`delete from "QueueItem" where "id"=$1`, [item.id]);
      await client.end();
    }
  });

  test("maps every queue status to explicit Thai customer guidance", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const item = await createTrackingItem(client);

    try {
      for (const [status, label, heading, guidance, toneClass] of statusCases) {
        await client.query(`update "QueueItem" set "status"=$1,"updatedAt"=now() where "id"=$2`, [status, item.id]);
        await page.goto(`/queue/${item.publicToken}`);
        const badge = page.getByText(label, { exact: true });
        await expect(badge).toBeVisible();
        await expect(badge).toHaveClass(new RegExp(toneClass));
        await expect(page.getByRole("heading", { name: heading })).toBeVisible();
        await expect(page.getByText(new RegExp(guidance))).toBeVisible();
      }
    } finally {
      await client.query(`delete from "QueueItem" where "id"=$1`, [item.id]);
      await client.end();
    }
  });

  test("keeps the customer keyboard path in action order", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const item = await createTrackingItem(client);

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/queue/${item.publicToken}`);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "กลับหน้าแรก" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "รับบัตรคิวใหม่" })).toBeFocused();
    } finally {
      await client.query(`delete from "QueueItem" where "id"=$1`, [item.id]);
      await client.end();
    }
  });

  test("renders a scoped V2 404 for unknown public tokens", async ({ page }) => {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    const item = await createTrackingItem(client);

    try {
      for (const publicPath of ["not-a-public-token", item.id, randomUUID()]) {
        for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
          await page.setViewportSize(viewport);
          const response = await page.goto(`/queue/${publicPath}`);
          expect(response?.status()).toBe(404);
          await expect(page.locator("main[data-customer-visual='v2'].bqa-customer-not-found-v2")).toBeVisible();
          await expect(page.getByRole("heading", { name: "คิวนี้ไม่มีอยู่แล้ว" })).toBeVisible();
          const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
          expect(width.scroll).toBe(width.client);
        }
      }

      const unrelatedResponse = await page.goto("/privacy/not-a-route");
      expect(unrelatedResponse?.status()).toBe(404);
      await expect(page.locator("main[data-customer-visual='legacy']")).toBeVisible();
      await expect(page.locator("main.bqa-customer-not-found-v2")).toHaveCount(0);
    } finally {
      await client.query(`delete from "QueueItem" where "id"=$1`, [item.id]);
      await client.end();
    }
  });
});
