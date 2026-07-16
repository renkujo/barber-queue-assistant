import Link from "next/link";
import { type ReactNode } from "react";
import { StatusBadge } from "@/components/barber/app-ui";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icon,
  type IButtonProps,
} from "@/components/ui";
import { QueueItemStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import type { QueueListItem } from "@/lib/queue/repository";
import { updateQueueOrderAction, updateQueueStatusAction } from "../actions";
import { ConfirmStatusActionButton } from "../confirm-status-action-button";
import { OwnerQueueShareButton } from "./owner-queue-share-button";

type OwnerQueueRowItem = QueueListItem & {
  accessPin?: string;
  ownerNote?: string;
  publicToken?: string;
};

const rowTone = (tone?: "current" | "next" | "warning") => {
  if (tone === "current") return "positive";
  if (tone === "next") return "warm";
  if (tone === "warning") return "warning";
  return "neutral";
};

type StatusActionButtonProps = {
  itemId?: string;
  status: QueueItemStatus;
  children: ReactNode;
  variant?: NonNullable<IButtonProps["variant"]>;
  size?: NonNullable<IButtonProps["size"]>;
  disabled?: boolean;
  className?: string;
};

type QueueReorderIntent = "up" | "down" | "bottom";

const StatusActionButton = ({
  itemId,
  status,
  children,
  variant = "outline",
  size = "default",
  disabled = false,
  className,
}: StatusActionButtonProps) => {
  if (!itemId || disabled) {
    return (
      <Button variant={variant} type="button" size={size} disabled fullWidth className={className}>
        {children}
      </Button>
    );
  }

  return (
    <form action={updateQueueStatusAction}>
      <input name="queueItemId" type="hidden" value={itemId} />
      <input name="status" type="hidden" value={status} />
      <Button variant={variant} type="submit" size={size} fullWidth className={className}>
        {children}
      </Button>
    </form>
  );
};

const getQueueCustomerLabel = (item?: QueueListItem) => (item ? `${item.code} ${item.customerName}` : "ยังไม่มีคิว");

const DoneConfirmButton = ({ item, disabled }: { item?: QueueListItem; disabled: boolean }) => (
  <ConfirmStatusActionButton
    itemId={item?.id}
    status={QueueItemStatus.DONE}
    label="เสร็จ"
    customerLabel={getQueueCustomerLabel(item)}
    title="ยืนยันว่าคิวนี้เสร็จแล้ว?"
    description="คิวนี้จะถูกปิดงานและไม่แสดงในรายการ active ของวันนี้"
    confirmLabel="ยืนยันเสร็จ"
    variant="default"
    size="sm"
    tone="complete"
    className="bqa-owner-action-button bqa-owner-action-button--done"
    disabled={disabled || !item}
  />
);

const CancelConfirmButton = ({ item, disabled }: { item: QueueListItem; disabled: boolean }) => (
  <ConfirmStatusActionButton
    itemId={item.id}
    status={QueueItemStatus.CANCELLED}
    label="ยกเลิก"
    customerLabel={getQueueCustomerLabel(item)}
    title="ยืนยันยกเลิกคิวนี้?"
    description="คิวนี้จะถูกนำออกจากรายการวันนี้ ถ้ากดยกเลิกผิดต้องสร้างหรือแก้คิวใหม่"
    confirmLabel="ยืนยันยกเลิก"
    variant="outline"
    size="sm"
    tone="danger"
    className="bqa-owner-action-button bqa-owner-action-button--cancel"
    disabled={disabled}
  />
);

const NoShowConfirmButton = ({ item, disabled }: { item: QueueListItem; disabled: boolean }) => (
  <ConfirmStatusActionButton
    itemId={item.id}
    status={QueueItemStatus.NO_SHOW}
    label="ไม่มา"
    customerLabel={getQueueCustomerLabel(item)}
    title="ยืนยันว่าลูกค้าไม่มา?"
    description="ระบบจะบันทึกคิวนี้เป็น no-show และปล่อยพื้นที่ให้คิวถัดไป"
    confirmLabel="ยืนยันไม่มา"
    variant="destructive"
    size="sm"
    tone="warning"
    className="bqa-owner-action-button bqa-owner-action-button--no-show"
    disabled={disabled}
  />
);

const QueueRowScheduleWarning = ({ item }: { item: OwnerQueueRowItem }) => {
  if (!item.scheduleWarning) {
    return null;
  }

  return (
    <span className="bqa-owner-schedule-warning">
      <Icon icon="lucide:calendar-clock" aria-hidden="true" />
      {item.scheduleWarning}
    </span>
  );
};

const QueueRowNote = ({ item }: { item: OwnerQueueRowItem }) => {
  const ownerNote = item.ownerNote;
  const note = (
    <span className="bqa-owner-board-note-stack">
      <span>{item.note}</span>
      {ownerNote ? <span className="bqa-owner-private-note">โน้ต: {ownerNote}</span> : null}
      <QueueRowScheduleWarning item={item} />
    </span>
  );

  return note;
};

const QueueRowEditLink = ({ item }: { item: QueueListItem }) => (
  <Link href={`/owner/queue/${item.id}/edit`} className="bqa-owner-queue-edit">
    <Icon icon="lucide:square-pen" aria-hidden="true" />แก้ไข
  </Link>
);

const QueueRowAccess = ({ item }: { item: OwnerQueueRowItem }) => {
  if (!item.accessPin || !item.publicToken) {
    return null;
  }

  return (
    <div className="bqa-owner-queue-access">
      <span className="bqa-owner-queue-pin">PIN {item.accessPin}</span>
      <OwnerQueueShareButton accessPin={item.accessPin} publicToken={item.publicToken} queueCode={item.code} />
    </div>
  );
};

const QueueRowTime = ({ item }: { item: QueueListItem }) => (
  <div className="bqa-owner-queue-time">{item.timeLabel}</div>
);

const QueueRowIdentity = ({ canMutateQueue, item }: { canMutateQueue: boolean; item: OwnerQueueRowItem }) => (
  <div className="bqa-owner-queue-main">
    <strong>
      {item.code} {item.customerName}
    </strong>
    {canMutateQueue ? <QueueRowEditLink item={item} /> : null}
    {canMutateQueue ? <QueueRowAccess item={item} /> : null}
    <p className="bqa-owner-queue-mobile-note">
      <QueueRowNote item={item} />
    </p>
  </div>
);

const QueueRowServiceNote = ({ item }: { item: OwnerQueueRowItem }) => (
  <div className="bqa-owner-queue-note">
    <QueueRowNote item={item} />
  </div>
);

const QueueRowStatus = ({ item }: { item: QueueListItem }) => (
  <div className="bqa-owner-queue-status">
    <StatusBadge tone={rowTone(item.tone)}>{item.statusLabel}</StatusBadge>
  </div>
);

const ReorderActionButton = ({
  disabled,
  intent,
  itemId,
  label,
}: {
  disabled: boolean;
  intent: QueueReorderIntent;
  itemId: string;
  label: string;
}) => {
  if (disabled) {
    return (
      <Button variant="outline" type="button" size="sm" disabled fullWidth className="bqa-owner-reorder-button">
        {label}
      </Button>
    );
  }

  return (
    <form action={updateQueueOrderAction}>
      <input name="queueItemId" type="hidden" value={itemId} />
      <input name="intent" type="hidden" value={intent} />
      <Button variant="outline" type="submit" size="sm" fullWidth className="bqa-owner-reorder-button">
        {label}
      </Button>
    </form>
  );
};

const QueueRowReorderActions = ({
  disabled,
  item,
  rowIndex,
  totalCount,
}: {
  disabled: boolean;
  item: QueueListItem;
  rowIndex: number;
  totalCount: number;
}) => {
  if (totalCount < 2 || item.status === QueueItemStatus.IN_PROGRESS) {
    return null;
  }

  const isFirst = rowIndex === 0;
  const isLast = rowIndex === totalCount - 1;
  const reorderControls = (
    <>
      <ReorderActionButton disabled={disabled || isFirst} intent="up" itemId={item.id} label="ขึ้น" />
      <ReorderActionButton disabled={disabled || isLast} intent="down" itemId={item.id} label="ลง" />
      <ReorderActionButton disabled={disabled || isLast} intent="bottom" itemId={item.id} label="ท้าย" />
    </>
  );

  return (
    <>
      <details className="bqa-owner-reorder-disclosure">
        <summary>จัดลำดับ</summary>
        <div className="bqa-owner-reorder-actions" aria-label={`จัดลำดับ ${item.code} ${item.customerName}`}>
          {reorderControls}
        </div>
      </details>
      <div className="bqa-owner-reorder-actions bqa-owner-reorder-actions--desktop" aria-label={`จัดลำดับ ${item.code} ${item.customerName}`}>
        {reorderControls}
      </div>
    </>
  );
};

const QueueRowActions = ({
  disabled,
  isPrimaryCandidate,
  item,
}: {
  disabled: boolean;
  isPrimaryCandidate: boolean;
  item: QueueListItem;
}) => {
  if (item.tone === "current") {
    return (
      <div className="bqa-owner-board-actions bqa-owner-board-actions--terminal">
        <DoneConfirmButton item={item} disabled={disabled} />
        <CancelConfirmButton item={item} disabled={disabled} />
      </div>
    );
  }

  if (item.tone === "warning") {
    return (
      <div className="bqa-owner-board-actions bqa-owner-board-actions--quiet">
        <StatusActionButton itemId={item.id} status={QueueItemStatus.WAITING} size="sm" disabled={disabled} className="bqa-owner-action-button bqa-owner-action-button--wait">
          รอเพิ่ม
        </StatusActionButton>
        <NoShowConfirmButton item={item} disabled={disabled} />
      </div>
    );
  }

  if (!isPrimaryCandidate) {
    return (
      <span className="bqa-owner-passive-action" aria-label="ยังไม่ถึงคิวนี้">
        <Icon icon="lucide:clock" aria-hidden="true" />ยังไม่ถึงคิว
      </span>
    );
  }

  return (
    <div className="bqa-owner-board-actions bqa-owner-board-actions--primary">
      <StatusActionButton itemId={item.id} status={QueueItemStatus.IN_PROGRESS} variant="default" size="sm" disabled={disabled} className="bqa-owner-action-button bqa-owner-action-button--start">
        <Icon icon="lucide:circle-play" aria-hidden="true" />เริ่มตัด
      </StatusActionButton>
      <div className="bqa-owner-board-actions bqa-owner-board-actions--quiet">
        <StatusActionButton itemId={item.id} status={QueueItemStatus.LATE} variant="outline" size="sm" disabled={disabled} className="bqa-owner-action-button bqa-owner-action-button--late">
          <Icon icon="lucide:triangle-alert" aria-hidden="true" />สาย
        </StatusActionButton>
        <CancelConfirmButton item={item} disabled={disabled} />
      </div>
    </div>
  );
};

const OwnerQueueRow = ({
  canMutateQueue,
  isPrimaryCandidate,
  item,
  rowIndex,
  totalCount,
}: {
  canMutateQueue: boolean;
  isPrimaryCandidate: boolean;
  item: OwnerQueueRowItem;
  rowIndex: number;
  totalCount: number;
}) => (
  <article className={cn("bqa-owner-queue-row", isPrimaryCandidate && "bqa-owner-queue-row--active", `bqa-tone-${rowTone(item.tone)}`)}>
    <QueueRowTime item={item} />
    <QueueRowIdentity canMutateQueue={canMutateQueue} item={item} />
    <QueueRowServiceNote item={item} />
    <QueueRowStatus item={item} />
    <div className="bqa-owner-queue-manage">
      <QueueRowActions item={item} disabled={!canMutateQueue} isPrimaryCandidate={isPrimaryCandidate} />
      <QueueRowReorderActions disabled={!canMutateQueue} item={item} rowIndex={rowIndex} totalCount={totalCount} />
    </div>
  </article>
);

export const OwnerQueueBoard = ({
  canMutateQueue,
  primaryItemId,
  queue,
}: {
  canMutateQueue: boolean;
  primaryItemId?: string;
  queue: QueueListItem[];
}) => (
  <Card className="bqa-owner-queue-board" aria-labelledby="owner-queue-title">
    <CardHeader className="bqa-owner-queue-heading">
      <div>
        <CardTitle id="owner-queue-title">รายการวันนี้</CardTitle>
        <CardDescription>{queue.length} คิวในระบบวันนี้</CardDescription>
      </div>
      <CardAction>
        <Button asChild size="md" className="bqa-owner-add-walkin">
          <Link href="/owner/walk-in">
            <Icon icon="lucide:plus" aria-hidden="true" />เพิ่ม walk-in
          </Link>
        </Button>
      </CardAction>
    </CardHeader>

    <CardContent className="bqa-owner-queue-content">
      <div className="bqa-owner-queue-head" aria-hidden="true">
        <span><Icon icon="lucide:clock" />เวลา</span>
        <span>คิว</span>
        <span>บริการ / หมายเหตุ</span>
        <span>สถานะ</span>
        <span>จัดการ</span>
      </div>

      <div className="bqa-owner-queue-list">
        {queue.length > 0 ? (
          queue.map((item, index) => (
            <OwnerQueueRow
              canMutateQueue={canMutateQueue}
              isPrimaryCandidate={item.id === primaryItemId}
              item={item}
              key={item.id}
              rowIndex={index}
              totalCount={queue.length}
            />
          ))
        ) : (
          <div className="bqa-owner-queue-empty">ยังไม่มีคิววันนี้</div>
        )}
      </div>
    </CardContent>
  </Card>
);
