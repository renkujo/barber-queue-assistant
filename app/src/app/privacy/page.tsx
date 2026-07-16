import type { Metadata } from "next";
import Link from "next/link";
import { AppCard, Notice, PageHeader, Panel, ScreenShell, SectionHeader } from "@/components/barber/app-ui";
import { Button, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "ประกาศความเป็นส่วนตัว",
  description: "รายละเอียดการใช้และดูแลข้อมูลสำหรับระบบจองและติดตามคิวร้านตัดผม",
};

export const dynamic = "force-dynamic";

const getContactHref = (contact: string) => {
  if (/^(https?:\/\/|mailto:|tel:)/.test(contact)) {
    return contact;
  }

  if (contact.includes("@")) {
    return `mailto:${contact}`;
  }

  return null;
};

const PrivacyPage = () => {
  const privacyContact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT?.trim() ?? "";
  const contactHref = getContactHref(privacyContact);

  return (
    <ScreenShell className="bqa-book-shell">
      <AppCard labelledBy="privacy-title" className="bqa-book-card bqa-privacy-card">
        <PageHeader
          id="privacy-title"
          title="ประกาศความเป็นส่วนตัว"
          subtitle="ข้อมูลลูกค้าและข้อมูลคิว"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับ
              </Link>
            </Button>
          }
        />

        <Notice tone="warm">
          ระบบนี้ใช้สำหรับจองคิว รับบัตรคิว และแจ้งสถานะของร้านตัดผมหนึ่งร้านในช่วงทดลองใช้งานจริง
        </Notice>

        <Panel>
          <SectionHeader title="ข้อมูลที่เก็บ" />
          <ul className="bqa-privacy-list">
            <li>ชื่อ เบอร์โทรเมื่อผู้ใช้เลือกกรอก และ LINE user ID เมื่อเข้าใช้งานผ่าน LINE</li>
            <li>บริการ วัน เวลา สถานะคิว และหมายเหตุที่ลูกค้าส่งให้ร้าน</li>
            <li>ประวัติการแจ้งเตือน การยกเลิก มาสาย หรือไม่มาตามคิว เพื่อให้ร้านจัดการคิวได้ถูกต้อง</li>
          </ul>
        </Panel>

        <Panel>
          <SectionHeader title="ใช้ข้อมูลเพื่ออะไร" />
          <ul className="bqa-privacy-list">
            <li>สร้างและติดตามคิว ป้องกันเวลาซ้อน และให้เจ้าของร้านติดต่อกลับ</li>
            <li>ส่งข้อความยืนยันหรือแจ้งเตือนผ่าน LINE เมื่อเชื่อมบัญชีไว้</li>
            <li>ตรวจสอบปัญหาการใช้งานและปรับปรุงความแม่นยำของเวลารอ</li>
          </ul>
          <p className="bqa-copy">ข้อมูลเจ้าของร้านและหมายเหตุภายในจะไม่แสดงบนหน้าติดตามคิวสาธารณะ</p>
        </Panel>

        <Panel>
          <SectionHeader title="การเก็บรักษาและสิทธิของลูกค้า" />
          <p className="bqa-copy">
            ในช่วง pilot ร้านจะตรวจลบหรือทำให้ข้อมูลคิวที่เกินความจำเป็นไม่สามารถระบุตัวบุคคลได้ภายใน 180 วัน
            เว้นแต่จำเป็นต้องเก็บต่อเพื่อแก้ปัญหา ข้อพิพาท หรือหน้าที่ตามกฎหมาย
          </p>
          <p className="bqa-copy">
            ลูกค้าสามารถขอดู แก้ไข หรือลบข้อมูลของตนได้โดยแจ้งชื่อ รหัสคิว และ PIN เช็คคิวกับร้าน โดยแจ้งเบอร์โทรเพิ่มเมื่อเคยกรอกไว้
          </p>
        </Panel>

        <Panel>
          <SectionHeader title="ติดต่อเรื่องข้อมูลส่วนบุคคล" />
          {privacyContact ? (
            contactHref ? <a className="bqa-privacy-contact" href={contactHref}>{privacyContact}</a> : <p className="bqa-copy">{privacyContact}</p>
          ) : (
            <Notice>ก่อนเปิด pilot ร้านต้องตั้งค่า NEXT_PUBLIC_PRIVACY_CONTACT เป็น LINE URL, อีเมล หรือเบอร์โทรที่ลูกค้าใช้ติดต่อได้จริง</Notice>
          )}
        </Panel>

        <p className="bqa-privacy-note">ปรับปรุงล่าสุด: 16 กรกฎาคม 2569</p>
      </AppCard>
    </ScreenShell>
  );
};

export default PrivacyPage;
