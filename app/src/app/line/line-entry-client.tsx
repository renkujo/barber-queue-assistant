"use client";

import liff from "@line/liff";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Icon } from "@/components/ui";

type LineEntryClientProps = {
  liffId?: string;
  targetPath: "/book" | "/walk-in";
};

const getTargetLabel = (targetPath: LineEntryClientProps["targetPath"]) =>
  targetPath === "/book" ? "จองเวลา" : "รับคิววันนี้";

const buildTargetUrl = (targetPath: LineEntryClientProps["targetPath"], lineUserId: string) => {
  const params = new URLSearchParams({ lineUserId });

  return `${targetPath}?${params.toString()}`;
};

export const LineEntryClient = ({ liffId, targetPath }: LineEntryClientProps) => {
  const [message, setMessage] = useState("กำลังเชื่อมต่อ LINE...");
  const [isSetupMissing, setIsSetupMissing] = useState(false);
  const targetLabel = useMemo(() => getTargetLabel(targetPath), [targetPath]);

  useEffect(() => {
    let active = true;

    const connectLine = async () => {
      if (!liffId) {
        setIsSetupMissing(true);
        setMessage("ยังไม่ได้ตั้งค่า LIFF ID สำหรับเชื่อม LINE");
        return;
      }

      try {
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        const targetUrl = buildTargetUrl(targetPath, profile.userId);

        if (active) {
          window.location.assign(targetUrl);
        }
      } catch {
        if (active) {
          setMessage("เชื่อม LINE ไม่สำเร็จ เปิดผ่าน LINE อีกครั้ง หรือใช้ทางเข้าเว็บปกติ");
        }
      }
    };

    void connectLine();

    return () => {
      active = false;
    };
  }, [liffId, targetPath]);

  return (
    <div className="bqa-line-entry">
      <div className="bqa-line-entry-icon" aria-hidden="true">
        <Icon icon={isSetupMissing ? "lucide:settings" : "lucide:message-circle"} />
      </div>
      <p>{message}</p>
      <div className="bqa-button-pair">
        <Button asChild fullWidth>
          <Link href={targetPath}>{targetLabel}</Link>
        </Button>
        <Button asChild variant="outline" fullWidth>
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>
    </div>
  );
};
