import { Notice } from "@/components/barber/app-ui";
import { RouteToast } from "@/components/ui";
import { createBreakAction, updateManualWaitAction, updateQueueIntakeAction } from "./actions";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getOwnerClosedQueueItemsSafe, getOwnerQueueStatusSnapshotSafe, getOwnerRecentNotificationLogsSafe, getShopIntakeSettingsSafe } from "@/lib/queue/repository";
import { CurrentNextSummary } from "./_components/current-next-summary";
import { OwnerClosedQueueList } from "./_components/owner-closed-queue-list";
import { OwnerFooterStatus } from "./_components/owner-footer-status";
import { OwnerQueueBoard } from "./_components/owner-queue-board";
import { OwnerShell } from "./_components/owner-shell";
import { OwnerSideRail } from "./_components/owner-side-rail";
import { OwnerWorkspaceHeader } from "./_components/owner-workspace-header";
import { ShopStatusStrip } from "./_components/shop-status-strip";

export const dynamic = "force-dynamic";

type OwnerPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  "invalid-action": "คำสั่งไม่ถูกต้อง ลอง refresh แล้วทำใหม่อีกครั้ง",
  "action-failed": "ยังอัปเดตสถานะไม่ได้ ตรวจว่าเป็นคิวจากฐานข้อมูลจริงก่อน",
  "break-failed": "ยังเพิ่มเวลาพักไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
  "intake-failed": "ยังเปลี่ยนสถานะรับคิวไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
  "reorder-failed": "ยังเลื่อนลำดับคิวไม่ได้ ตรวจว่าเป็นคิว active ของวันนี้ก่อน",
  "restore-failed": "ยังเปิดคิวนี้กลับไม่ได้ ตรวจว่าเป็นคิวที่ปิดแล้วของวันนี้ก่อน",
  "wait-failed": "ยังปรับเวลารอไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
};

const statusMessages: Record<string, string> = {
  "status-updated": "อัปเดตสถานะคิวแล้ว",
  "break-created": "พักร้าน 30 นาทีแล้ว ช่วงเวลานี้จะไม่เปิดให้ลูกค้าจอง",
  "intake-closed": "ปิดรับคิวจากลูกค้าแล้ว เจ้าของร้านยังเพิ่มคิวเองได้",
  "intake-opened": "เปิดรับคิวจากลูกค้าแล้ว",
  "queue-updated": "แก้ไขคิวเรียบร้อยแล้ว",
  "queue-restored": "เปิดคิวกลับเข้ารายการวันนี้แล้ว",
  "queue-reordered": "เลื่อนลำดับคิวแล้ว",
  "wait-reset": "รีเซ็ตเวลารอกลับเป็นค่าคำนวณแล้ว",
  "wait-updated": "ปรับเวลารอที่แจ้งลูกค้าแล้ว",
  "walk-in-created": "เพิ่ม walk-in เข้าคิววันนี้แล้ว",
};

const OwnerPage = async ({ searchParams }: OwnerPageProps) => {
  await requireOwnerSession();

  const [params, snapshot, closedQueue, notificationLogs, intakeSettings] = await Promise.all([
    searchParams,
    getOwnerQueueStatusSnapshotSafe(),
    getOwnerClosedQueueItemsSafe(),
    getOwnerRecentNotificationLogsSafe(),
    getShopIntakeSettingsSafe(),
  ]);
  const todayQueue = snapshot.queue;
  const canMutateQueue = snapshot.source === "database";
  const current = todayQueue.find((item) => item.tone === "current");
  const next =
    todayQueue.find((item) => item.tone === "next" && item.id !== current?.id) ??
    todayQueue.find((item) => item.tone !== "warning" && item.tone !== "current" && item.id !== current?.id);
  const primaryItem = current ?? next;
  const currentCount = current ? 1 : 0;
  const waitingCount = Math.max(todayQueue.length - currentCount, 0);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <OwnerShell>
      <div className="bqa-owner-board-content">
        <OwnerWorkspaceHeader intakeEnabled={intakeSettings.queueIntakeEnabled} />
        {!canMutateQueue ? <Notice tone="warm">ตอนนี้เป็นข้อมูล fallback กดเปลี่ยนสถานะไม่ได้ สร้าง booking/walk-in จริงก่อน</Notice> : null}
        <RouteToast
          message={errorMessage ?? statusMessage}
          type={errorMessage ? "error" : "success"}
          toastKey={`owner:${params.error ?? params.status ?? ""}`}
        />
        {statusMessage ? <Notice tone="warm">{statusMessage}</Notice> : null}
        {errorMessage ? <Notice>{errorMessage}</Notice> : null}

        <ShopStatusStrip
          breakAction={createBreakAction}
          intakeAction={updateQueueIntakeAction}
          settings={intakeSettings}
          waitAction={updateManualWaitAction}
          waitEstimate={snapshot.shop}
        />
        <CurrentNextSummary current={current} next={next} />

        <div className="bqa-owner-board-grid">
          <div className="bqa-owner-board-main-column">
            <OwnerQueueBoard canMutateQueue={canMutateQueue} primaryItemId={primaryItem?.id} queue={todayQueue} />
            <OwnerClosedQueueList queue={closedQueue} />
          </div>
          <OwnerSideRail
            breakAction={createBreakAction}
            currentCount={currentCount}
            intakeAction={updateQueueIntakeAction}
            intakeSettings={intakeSettings}
            notificationLogs={notificationLogs}
            totalCount={todayQueue.length}
            waitAction={updateManualWaitAction}
            waitEstimate={snapshot.shop}
            waitingCount={waitingCount}
          />
        </div>

        <OwnerFooterStatus />
      </div>
    </OwnerShell>
  );
};

export default OwnerPage;
