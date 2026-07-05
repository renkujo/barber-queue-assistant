"use client";

import Link from "next/link";
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Icon } from "@/components/ui";

const ownerMenuItems = [
  {
    href: "/owner",
    icon: "lucide:list-checks",
    title: "คิววันนี้",
    description: "กลับไปดูและจัดการคิววันนี้",
  },
  {
    href: "/owner/walk-in",
    icon: "lucide:user-plus",
    title: "เพิ่ม walk-in",
    description: "เพิ่มลูกค้าหน้าร้านเข้าคิวทันที",
  },
  {
    href: "/owner/settings",
    icon: "lucide:settings",
    title: "ตั้งค่าร้าน",
    description: "ชื่อร้าน เวลาเปิดปิด และสถานะรับคิว",
  },
  {
    href: "/owner/settings/services",
    icon: "lucide:scissors",
    title: "ตั้งค่าบริการ",
    description: "ราคา ระยะเวลา และการเปิดใช้บริการ",
  },
] as const;

export const OwnerMenuButton = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="md" className="bqa-owner-board-icon-button" type="button" aria-label="เมนูเจ้าของร้าน">
        <Icon icon="lucide:menu" aria-hidden="true" />
        <span>เมนู</span>
      </Button>
    </DialogTrigger>
    <DialogContent className="bqa-owner-menu-dialog">
      <DialogHeader>
        <DialogTitle>เมนูเจ้าของร้าน</DialogTitle>
        <DialogDescription>เลือกงานที่ต้องทำต่อได้จากตรงนี้</DialogDescription>
      </DialogHeader>

      <div className="bqa-owner-menu-list">
        {ownerMenuItems.map((item) => (
          <DialogClose asChild key={item.href}>
            <Link href={item.href} className="bqa-owner-menu-link">
              <span className="bqa-owner-menu-icon">
                <Icon icon={item.icon} aria-hidden="true" />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </Link>
          </DialogClose>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
