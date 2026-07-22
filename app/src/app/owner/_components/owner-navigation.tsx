"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, LineLogo } from "@/components/ui";
import { cn } from "@/lib/cn";

type OwnerNavigationItem = {
  href: string;
  icon: `lucide:${string}`;
  label: string;
  match: "exact" | "prefix" | "settings" | "today";
};

const desktopItems: OwnerNavigationItem[] = [
  { href: "/owner", icon: "lucide:clipboard-list", label: "คิววันนี้", match: "today" },
  { href: "/owner/walk-in", icon: "lucide:plus", label: "เพิ่มคิว", match: "prefix" },
  { href: "/owner/settings/availability", icon: "lucide:calendar-days", label: "ตารางรับลูกค้า", match: "prefix" },
  { href: "/owner/settings/services", icon: "lucide:scissors", label: "บริการ", match: "prefix" },
  { href: "/owner/settings", icon: "lucide:settings", label: "ตั้งค่าร้าน", match: "exact" },
];

const mobileItems: OwnerNavigationItem[] = [
  { href: "/owner", icon: "lucide:clipboard-list", label: "วันนี้", match: "today" },
  { href: "/owner/walk-in", icon: "lucide:user-plus", label: "เพิ่มคิว", match: "prefix" },
  { href: "/owner/settings/availability", icon: "lucide:calendar-days", label: "ตาราง", match: "prefix" },
  { href: "/owner/settings", icon: "lucide:ellipsis", label: "เพิ่มเติม", match: "settings" },
];

const isActiveItem = (pathname: string, item: OwnerNavigationItem) => {
  if (item.match === "today") {
    return pathname === item.href || pathname.startsWith("/owner/queue/");
  }

  if (item.match === "exact") {
    return pathname === item.href;
  }

  if (item.match === "settings") {
    return pathname.startsWith(item.href) && !pathname.startsWith("/owner/settings/availability");
  }

  return pathname.startsWith(item.href);
};

const OwnerNavigationLink = ({ item, pathname }: { item: OwnerNavigationItem; pathname: string }) => {
  const isActive = isActiveItem(pathname, item);

  return (
    <Link
      href={item.href}
      className={cn("bqa-owner-nav-link", isActive && "bqa-owner-nav-link--active")}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon icon={item.icon} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
};

type OwnerNavigationProps = {
  logoutAction: () => Promise<void>;
};

export const OwnerNavigation = ({ logoutAction }: OwnerNavigationProps) => {
  const pathname = usePathname();

  return (
    <>
      <aside className="bqa-owner-desktop-sidebar" aria-label="เมนูเจ้าของร้าน">
        <Link href="/owner" className="bqa-owner-sidebar-brand">
          <span className="bqa-owner-sidebar-mark" aria-hidden="true">
            <Image src="/icons/joined-tail-q-r1-ui-512.png" alt="" width={44} height={44} priority />
          </span>
          <span>
            <strong>Barber Queue</strong>
            <small>โหมดเจ้าของร้าน</small>
          </span>
        </Link>

        <nav className="bqa-owner-desktop-nav">
          {desktopItems.map((item) => (
            <OwnerNavigationLink item={item} pathname={pathname} key={item.href} />
          ))}
        </nav>

        <div className="bqa-owner-sidebar-footer">
          <Link href="/owner/settings" className="bqa-owner-line-state">
            <LineLogo aria-hidden="true" />
            ตั้งค่า LINE เจ้าของร้าน
          </Link>
          <form action={logoutAction}>
            <button className="bqa-owner-logout-button" type="submit">
              <Icon icon="lucide:log-out" aria-hidden="true" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      <header className="bqa-owner-mobile-topbar">
        <Link href="/owner" className="bqa-owner-mobile-brand">
          <span className="bqa-owner-mobile-mark" aria-hidden="true">
            <Image src="/icons/joined-tail-q-r1-ui-512.png" alt="" width={40} height={40} priority />
          </span>
          <span>
            <strong>Barber Queue</strong>
            <small>คิววันนี้</small>
          </span>
        </Link>
        <Link href="/owner/settings" className="bqa-owner-mobile-settings" aria-label="ตั้งค่าร้าน">
          <Icon icon="lucide:settings" aria-hidden="true" />
        </Link>
      </header>

      <nav className="bqa-owner-mobile-bottom-nav" aria-label="เมนูหลักเจ้าของร้าน">
        {mobileItems.map((item) => (
          <OwnerNavigationLink item={item} pathname={pathname} key={item.href} />
        ))}
      </nav>
    </>
  );
};
