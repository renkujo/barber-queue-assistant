import Link from "next/link";
import { Icon } from "@/components/ui";

export const OwnerFooterStatus = () => (
  <footer className="bqa-owner-footer-status">
    <span>
      <Icon icon="lucide:clock" aria-hidden="true" />อัปเดตล่าสุด 10:12
    </span>
    <Link href="/owner">
      <Icon icon="lucide:refresh-cw" aria-hidden="true" />รีเฟรช
    </Link>
  </footer>
);
