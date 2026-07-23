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
  if (status === QueueItemStatus.ARRIVED || status === QueueItemStatus.DONE || status === QueueItemStatus.IN_PROGRESS) return "positive";
  if (status === QueueItemStatus.WAITING) return "warm";
  if (status === QueueItemStatus.LATE) return "warning";
  if (status === QueueItemStatus.NO_SHOW || status === QueueItemStatus.CANCELLED) return "danger";

  return "neutral";
};

const getTrackingMessage = (status: string) => {
  if (status === QueueItemStatus.CONFIRMED) {
    return { title: "ยืนยันคิวแล้ว", note: "ร้านได้รับคิวจองของคุณแล้ว ตรวจวันและเวลาที่แสดงไว้ก่อนเดินทาง" };
  }

  if (status === QueueItemStatus.ARRIVED) {
    return { title: "เช็กอินถึงร้านแล้ว", note: "ร้านรับทราบว่าคุณมาถึงแล้ว กรุณารอเจ้าของร้านเรียกตามลำดับ" };
  }

  if (status === QueueItemStatus.WAITING) {
    return { title: "กำลังรอเรียกคิว", note: "คิวของคุณอยู่ในรายการรอ กรุณาติดตามสถานะจากหน้านี้" };
  }

  if (status === QueueItemStatus.IN_PROGRESS) {
    return { title: "กำลังให้บริการ", note: "ถึงคิวของคุณแล้ว เจ้าของร้านกำลังดำเนินการอยู่" };
  }

  if (status === QueueItemStatus.LATE) {
    return { title: "คิวนี้ถูกทำเครื่องหมายว่ามาสาย", note: "หากยังต้องการรับบริการ ให้รับบัตรคิวใหม่เพื่อให้ร้านจัดลำดับอีกครั้ง" };
  }

  if (status === QueueItemStatus.NO_SHOW) {
    return { title: "คิวนี้ถูกบันทึกว่าไม่มา", note: "คิวนี้ถูกปิดแล้ว หากยังต้องการรับบริการ ให้รับบัตรคิวใหม่" };
  }

  if (status === QueueItemStatus.CANCELLED) {
    return { title: "คิวนี้ถูกยกเลิก", note: "คิวนี้ไม่อยู่ในรายการรอแล้ว หากยังต้องการรับบริการ ให้รับบัตรคิวใหม่" };
  }

  if (status === QueueItemStatus.DONE) {
    return { title: "บริการเสร็จแล้ว", note: "คิวนี้ถูกปิดงานเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ" };
  }

  return { title: "ติดตามสถานะคิว", note: "เก็บรหัสคิวและ PIN ไว้ใช้กลับมาเปิดหน้านี้อีกครั้ง" };
};

const QueueTrackingPage = async ({ params }: QueueTrackingPageProps) => {
  const { id: publicToken } = await params;
  const queueItem = await getPublicQueueItemByToken(publicToken).catch(() => null);

  if (!queueItem) {
    notFound();
  }

  const trackingMessage = getTrackingMessage(queueItem.status);

  return (
    <ScreenShell className="bqa-book-shell bqa-customer-tracking-v2" visualVersion="v2">
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

            <section className="bqa-tracking-access" aria-labelledby="tracking-access-title">
              <div>
                <span id="tracking-access-title">PIN เช็คคิว</span>
                <strong className="bqa-tracking-access-pin">{queueItem.accessPin}</strong>
              </div>
              <p>เก็บ PIN นี้ไว้ใช้คู่กับรหัสคิวเมื่อกลับมาเช็คสถานะจากหน้าแรก</p>
            </section>

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
              <Icon icon="lucide:users" aria-hidden="true" />รับบัตรคิวใหม่
            </Link>
          </Button>
        </div>
      </AppCard>
    </ScreenShell>
  );
};

export default QueueTrackingPage;
