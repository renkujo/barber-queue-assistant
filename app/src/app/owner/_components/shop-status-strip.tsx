import type { QueueStatusSnapshot, ShopIntakeSettings } from "@/lib/queue/repository";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Icon,
} from "@/components/ui";

type ShopStatusStripProps = {
  breakAction: () => Promise<void>;
  intakeAction: (formData: FormData) => Promise<void>;
  settings: ShopIntakeSettings;
  waitAction: (formData: FormData) => Promise<void>;
  waitEstimate: QueueStatusSnapshot["shop"];
};

const formatFriendlyWait = (minutes: number) => {
  if (minutes <= 0) {
    return "ยังไม่ต้องรอ";
  }

  if (minutes < 60) {
    return `ประมาณ ${minutes} นาที`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) {
    return `ประมาณ ${hours} ชม.`;
  }

  return `ประมาณ ${hours} ชม. ${remainingMinutes} นาที`;
};

const getWaitSourceLabel = (waitEstimate: QueueStatusSnapshot["shop"]) => {
  if (waitEstimate.waitEstimateSource === "manual") {
    return "เจ้าของร้านปรับเอง";
  }

  return "คำนวณจากคิวตอนนี้";
};

const WaitAdjustButton = ({
  children,
  currentWaitMinutes,
  disabled,
  intent,
  waitAction,
}: {
  children: string;
  currentWaitMinutes: number;
  disabled?: boolean;
  intent: "add-10" | "add-20" | "reset";
  waitAction: (formData: FormData) => Promise<void>;
}) => (
  <form action={waitAction}>
    <input name="intent" type="hidden" value={intent} />
    <input name="currentWaitMinutes" type="hidden" value={currentWaitMinutes} />
    <Button variant="outline" type="submit" size="xs" disabled={disabled} className="bqa-owner-wait-action">
      {children}
    </Button>
  </form>
);

export const OwnerShopControlPanel = ({ breakAction, intakeAction, settings, waitAction, waitEstimate }: ShopStatusStripProps) => (
  <div className="bqa-owner-shop-control-panel">
    <div className="bqa-owner-wait-control" aria-label="ปรับเวลารอที่แจ้งลูกค้า">
      <div>
        <span>เวลารอโดยประมาณ</span>
        <strong>{formatFriendlyWait(waitEstimate.estimatedWaitMinutes)}</strong>
        <small>{getWaitSourceLabel(waitEstimate)}</small>
      </div>
      <div className="bqa-owner-wait-actions">
        <WaitAdjustButton currentWaitMinutes={waitEstimate.estimatedWaitMinutes} intent="add-10" waitAction={waitAction}>+10</WaitAdjustButton>
        <WaitAdjustButton currentWaitMinutes={waitEstimate.estimatedWaitMinutes} intent="add-20" waitAction={waitAction}>+20</WaitAdjustButton>
        <WaitAdjustButton currentWaitMinutes={waitEstimate.estimatedWaitMinutes} intent="reset" waitAction={waitAction} disabled={waitEstimate.manualWaitMinutes === null}>รีเซ็ต</WaitAdjustButton>
      </div>
    </div>

    <div className="bqa-owner-status-actions">
      <form action={intakeAction}>
        <input name="enabled" type="hidden" value={settings.queueIntakeEnabled ? "false" : "true"} />
        <Button variant={settings.queueIntakeEnabled ? "outline" : "default"} type="submit" size="md" className="bqa-owner-intake-action">
          <Icon icon={settings.queueIntakeEnabled ? "lucide:pause" : "lucide:play"} aria-hidden="true" />
          {settings.queueIntakeEnabled ? "ปิดรับคิว" : "เปิดรับคิว"}
        </Button>
      </form>
      <form action={breakAction}>
        <Button variant="outline" type="submit" size="md" className="bqa-owner-break-action">
          <Icon icon="lucide:clock" aria-hidden="true" />พัก 30 นาที
        </Button>
      </form>
    </div>
  </div>
);

export const ShopStatusStrip = ({ breakAction, intakeAction, settings, waitAction, waitEstimate }: ShopStatusStripProps) => (
  <section
    id="owner-shop-status"
    className={`bqa-owner-status-strip ${settings.queueIntakeEnabled ? "" : "bqa-owner-status-strip--closed"}`}
    aria-label="สถานะร้าน"
  >
    <div className="bqa-owner-status-copy">
      <span className="bqa-owner-status-dot" aria-hidden="true" />
      <div>
        <strong>{settings.queueIntakeEnabled ? "ร้านเปิดอยู่" : "ปิดรับคิวแล้ว"}</strong>
        <p>{settings.queueIntakeEnabled ? "รับคิวออนไลน์" : "เจ้าของร้านยังเพิ่มคิวเองได้"}</p>
      </div>
    </div>

    <span className="bqa-owner-status-wait">{formatFriendlyWait(waitEstimate.estimatedWaitMinutes)}</span>

    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" size="sm" className="bqa-owner-mobile-control-trigger">
          <Icon icon="lucide:sliders-horizontal" aria-hidden="true" />ควบคุมร้าน
        </Button>
      </DialogTrigger>
      <DialogContent className="bqa-owner-mobile-control-dialog">
        <DialogHeader>
          <DialogTitle>ควบคุมร้าน</DialogTitle>
          <DialogDescription>ปรับเวลารอ พักร้าน หรือเปิด–ปิดการรับคิวออนไลน์</DialogDescription>
        </DialogHeader>
        <OwnerShopControlPanel
          breakAction={breakAction}
          intakeAction={intakeAction}
          settings={settings}
          waitAction={waitAction}
          waitEstimate={waitEstimate}
        />
      </DialogContent>
    </Dialog>
  </section>
);
