import Link from "next/link";

export const PrivacyNote = () => (
  <p className="bqa-privacy-note">
    เมื่อส่งข้อมูล คุณรับทราบว่าเราจะใช้ชื่อ เบอร์โทร และข้อมูลคิวเพื่อให้บริการตาม
    {" "}
    <Link href="/privacy" target="_blank" rel="noreferrer">
      ประกาศความเป็นส่วนตัว
    </Link>
  </p>
);
