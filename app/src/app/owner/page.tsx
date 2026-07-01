import { Notice } from "@/components/barber/app-ui";
import { RouteToast } from "@/components/ui";
import { createBreakAction } from "./actions";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getOwnerClosedQueueItemsSafe, getOwnerQueueStatusSnapshotSafe } from "@/lib/queue/repository";
import { CurrentNextSummary } from "./_components/current-next-summary";
import { OwnerClosedQueueList } from "./_components/owner-closed-queue-list";
import { OwnerFooterStatus } from "./_components/owner-footer-status";
import { OwnerQueueBoard } from "./_components/owner-queue-board";
import { OwnerSideRail } from "./_components/owner-side-rail";
import { OwnerTopbar } from "./_components/owner-topbar";
import { ShopStatusStrip } from "./_components/shop-status-strip";

type OwnerPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  "invalid-action": "คำสั่งไม่ถูกต้อง ลอง refresh แล้วทำใหม่อีกครั้ง",
  "action-failed": "ยังอัปเดตสถานะไม่ได้ ตรวจว่าเป็นคิวจากฐานข้อมูลจริงก่อน",
  "break-failed": "ยังเพิ่มเวลาพักไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
  "restore-failed": "ยังเปิดคิวนี้กลับไม่ได้ ตรวจว่าเป็นคิวที่ปิดแล้วของวันนี้ก่อน",
};

const statusMessages: Record<string, string> = {
  "status-updated": "อัปเดตสถานะคิวแล้ว",
  "break-created": "พักร้าน 30 นาทีแล้ว ช่วงเวลานี้จะไม่เปิดให้ลูกค้าจอง",
  "queue-updated": "แก้ไขคิวเรียบร้อยแล้ว",
  "queue-restored": "เปิดคิวกลับเข้ารายการวันนี้แล้ว",
  "walk-in-created": "เพิ่ม walk-in เข้าคิววันนี้แล้ว",
};

const OwnerPage = async ({ searchParams }: OwnerPageProps) => {
  await requireOwnerSession();

  const [params, snapshot, closedQueue] = await Promise.all([searchParams, getOwnerQueueStatusSnapshotSafe(), getOwnerClosedQueueItemsSafe()]);
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
    <main className="bqa-owner-board-shell">
      <OwnerTopbar />

      <div className="bqa-owner-board-content">
        {!canMutateQueue ? <Notice tone="warm">ตอนนี้เป็นข้อมูล fallback กดเปลี่ยนสถานะไม่ได้ สร้าง booking/walk-in จริงก่อน</Notice> : null}
        <RouteToast
          message={errorMessage ?? statusMessage}
          type={errorMessage ? "error" : "success"}
          toastKey={`owner:${params.error ?? params.status ?? ""}`}
        />
        {statusMessage ? <Notice tone="warm">{statusMessage}</Notice> : null}
        {errorMessage ? <Notice>{errorMessage}</Notice> : null}

        <ShopStatusStrip action={createBreakAction} />
        <CurrentNextSummary current={current} next={next} />

        <div className="bqa-owner-board-grid">
          <div className="bqa-owner-board-main-column">
            <OwnerQueueBoard canMutateQueue={canMutateQueue} primaryItemId={primaryItem?.id} queue={todayQueue} />
            <OwnerClosedQueueList queue={closedQueue} />
          </div>
          <OwnerSideRail
            breakAction={createBreakAction}
            currentCount={currentCount}
            totalCount={todayQueue.length}
            waitingCount={waitingCount}
          />
        </div>

        <OwnerFooterStatus />
      </div>
    </main>
  );
};

export default OwnerPage;
