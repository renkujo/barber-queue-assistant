import Image from "next/image";
import Link from "next/link";
import { Button, Icon } from "@/components/ui";
import { OwnerMenuButton } from "./owner-menu-button";

export const OwnerTopbar = () => (
  <header className="bqa-owner-board-topbar">
    <Link href="/owner" className="bqa-owner-board-brand" aria-label="Barber Queue owner dashboard">
      <Image src="/assets/generated-v1/app-icon-pastel.png" alt="" width={72} height={72} priority />
      <span>
        <strong>Barber Queue</strong>
        <small>Owner mode</small>
      </span>
    </Link>

    <nav className="bqa-owner-board-topbar-actions" aria-label="คำสั่งเจ้าของร้าน">
      <Button asChild variant="outline" size="md" className="bqa-owner-board-icon-button">
        <Link href="/owner/settings">
          <Icon icon="lucide:settings" aria-hidden="true" />
          <span>ตั้งค่า</span>
        </Link>
      </Button>
      <OwnerMenuButton />
      <Button asChild variant="outline" size="md" className="bqa-owner-board-icon-button bqa-owner-board-refresh-button">
        <Link href="/owner">
          <Icon icon="lucide:refresh-cw" aria-hidden="true" />
          <span>รีเฟรช</span>
        </Link>
      </Button>
    </nav>
  </header>
);
