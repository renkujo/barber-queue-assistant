import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QueueItemStatus } from "@/generated/prisma/enums";
import {
  AppCard,
  PageHeader,
  Panel,
  ScreenShell,
  SectionHeader,
  StatGrid,
  StatTile,
  StatusBadge,
  TicketPanel,
} from "@/components/barber/app-ui";
import { Button, Icon } from "@/components/ui";
import { getPublicQueueItemByToken } from "@/lib/queue/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ติดตามคิว",
  robots: {
    index: false,
    follow: false,
  },
};

type QueueTrackingPageProps = {
  params: Promise<{ id: string }>;
};

const statusTone = (status: string) => {
  if (status === QueueItemStatus.DONE || status === QueueItemStatus.IN_PROGRESS) return "positive";
  if (status === QueueItemStatus.LATE || status === QueueItemStatus.NO_SHOW || status === QueueItemStatus.CANCELLED) return "warning";

  return "warm";
};

const getTrackingMessage = (status: string) => {
  if (status === QueueItemStatus.IN_PROGRESS) {
    return { title: "กำลังให้บริการ", note: "ถึงคิวของคุณแล้ว เจ้าของร้านกำลังดำเนินการอยู่" };
  }

  if (status === QueueItemStatus.LATE) {
    return { title: "คิวนี้ถูกทำเครื่องหมายว่ามาสาย", note: "ถ้ายังจะมา แนะนำติดต่อร้านโดยตรงเพื่อให้เจ้าของร้านจัดคิวใหม่" };
  }

  if (status === QueueItemStatus.NO_SHOW) {
    return { title: "คิวนี้ถูกบันทึกว่าไม่มา", note: "คิวนี้ถูกปิดแล้ว หากต้องการรับบริการ ให้รับคิวใหม่หรือติดต่อร้าน" };
  }

  if (status === QueueItemStatus.CANCELLED) {
    return { title: "คิวนี้ถูกยกเลิก", note: "คิวนี้ไม่อยู่ในรายการรอแล้ว หากต้องการรับบริการ ให้จองหรือรับคิวใหม่" };
  }

  if (status === QueueItemStatus.DONE) {
    return { title: "บริการเสร็จแล้ว", note: "คิวนี้ถูกปิดงานเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ" };
  }

  return { title: "แจ้งเตือนคิว", note: "ถ้าเข้าผ่าน LINE OA ภายหลัง ระบบจะส่งเตือนเมื่อใกล้ถึงคิวได้" };
};

const QueueTrackingPage = async ({ params }: QueueTrackingPageProps) => {
  const { id: publicToken } = await params;
  const queueItem = await getPublicQueueItemByToken(publicToken).catch(() => null);

  if (!queueItem) {
    notFound();
  }

  const trackingMessage = getTrackingMessage(queueItem.status);

  return (
    <ScreenShell className="bqa-book-shell">
      <AppCard labelledBy="tracking-title" className="bqa-book-card bqa-tracking-card">
        <PageHeader
          id="tracking-title"
          title="คิวของคุณ"
          subtitle="สถานะคิว"
          badge={<StatusBadge tone={statusTone(queueItem.status)}>{queueItem.statusLabel}</StatusBadge>}
        />

        <div className="bqa-tracking-layout">
          <div className="bqa-tracking-main">
            <TicketPanel className="bqa-tracking-ticket" label="รหัสคิว" value={queueItem.code} caption={queueItem.customerName} />

            <Panel className="bqa-panel--flush bqa-tracking-message">
              <SectionHeader title={trackingMessage.title} note={trackingMessage.note} />
            </Panel>
          </div>

          <aside className="bqa-tracking-side" aria-label="รายละเอียดคิว">
            <StatGrid className="bqa-stat-grid--flush bqa-tracking-stat-grid" aria-label="queue detail">
              <StatTile icon={<Icon icon="lucide:scissors" aria-hidden="true" />} label="บริการ" value={<span className="bqa-stat-text">{queueItem.serviceName}</span>} />
              <StatTile icon={<Icon icon="lucide:clock" aria-hidden="true" />} label="เวลา" value={<span className="bqa-stat-text">{queueItem.timeLabel}</span>} />
            </StatGrid>
          </aside>
        </div>

        <div className="bqa-button-pair bqa-tracking-actions">
          <Button asChild>
            <Link href="/">
              <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับหน้าแรก
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/walk-in">
              <Icon icon="lucide:users" aria-hidden="true" />รับคิวเพิ่ม
            </Link>
          </Button>
        </div>
      </AppCard>
    </ScreenShell>
  );
};

export default QueueTrackingPage;
