import Link from "next/link";
import { Button, Icon } from "@/components/ui";

const formatTodayLabel = () =>
  new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date());

export const OwnerWorkspaceHeader = ({ intakeEnabled }: { intakeEnabled: boolean }) => (
  <header className="bqa-owner-workspace-header">
    <div>
      <h1>คิววันนี้</h1>
      <p>
        <Icon icon="lucide:calendar-days" aria-hidden="true" />
        {formatTodayLabel()}
      </p>
    </div>
    <div className="bqa-owner-workspace-actions">
      <span className={intakeEnabled ? "" : "bqa-owner-workspace-state--closed"}>
        <i aria-hidden="true" />
        {intakeEnabled ? "ร้านเปิดอยู่ · รับคิวออนไลน์" : "ปิดรับคิวออนไลน์"}
      </span>
      <Button asChild size="md">
        <Link href="/owner/walk-in">
          <Icon icon="lucide:plus" aria-hidden="true" />เพิ่มคิว
        </Link>
      </Button>
    </div>
  </header>
);
