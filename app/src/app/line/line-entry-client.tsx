"use client";

import liff from "@line/liff";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Icon, LineLogo } from "@/components/ui";

type LineEntryClientProps = {
  liffId?: string;
  targetPath: string;
};

const getTargetLabel = (targetPath: LineEntryClientProps["targetPath"]) => {
  if (targetPath === "/book") {
    return "จองเวลา";
  }

  if (targetPath === "/#queue-status") {
    return "เช็คคิว";
  }

  if (targetPath.startsWith("/line/owner")) {
    return "เชื่อม LINE เจ้าของร้าน";
  }

  return "รับบัตรคิวออนไลน์";
};

const buildTargetUrl = (targetPath: LineEntryClientProps["targetPath"], lineUserId: string) => {
  if (targetPath === "/#queue-status") {
    return targetPath;
  }

  if (targetPath.startsWith("/line/owner")) {
    const url = new URL(targetPath, window.location.origin);
    url.searchParams.set("lineUserId", lineUserId);

    return `${url.pathname}${url.search}${url.hash}`;
  }

  const params = new URLSearchParams({ lineUserId });

  return `${targetPath}?${params.toString()}`;
};

const lineEntryStateCopy = {
  connecting: {
    icon: "line",
    title: "กำลังเปิด LINE เพื่อเชื่อมคิวของคุณ",
    description: "ถ้าเปิดจาก LINE ระบบจะพาไปขั้นตอนถัดไปอัตโนมัติ",
  },
  "setup-missing": {
    icon: "lucide:settings",
    title: "ยังเชื่อม LINE ไม่ได้",
    description: "ระบบยังไม่ได้ตั้งค่า LIFF ID ใช้ทางเข้าเว็บปกติก่อนได้",
  },
  error: {
    icon: "lucide:message-circle-warning",
    title: "เชื่อม LINE ไม่สำเร็จ",
    description: "เปิดผ่าน LINE อีกครั้ง หรือใช้ทางเข้าเว็บปกติได้",
  },
} as const;

export const LineEntryClient = ({ liffId, targetPath }: LineEntryClientProps) => {
  const [state, setState] = useState<"connecting" | "setup-missing" | "error">("connecting");
  const targetLabel = useMemo(() => getTargetLabel(targetPath), [targetPath]);
  const stateCopy = lineEntryStateCopy[state];

  useEffect(() => {
    let active = true;

    const connectLine = async () => {
      if (!liffId) {
        setState("setup-missing");
        return;
      }

      try {
        await liff.init({ liffId });

        if (!liff.isInClient()) {
          setState("error");
          return;
        }

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
          setState("error");
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
      <section className={`bqa-line-entry-panel bqa-line-entry-panel--${state}`} aria-live="polite">
        <div className="bqa-line-entry-icon" aria-hidden="true">
          {stateCopy.icon === "line" ? <LineLogo /> : <Icon icon={stateCopy.icon} />}
        </div>
        <div>
          <h2>{stateCopy.title}</h2>
          <p>{stateCopy.description}</p>
        </div>
      </section>
      <div className="bqa-button-pair">
        <Button asChild fullWidth>
          <Link href={targetPath}>ไปต่อ: {targetLabel}</Link>
        </Button>
        <Button asChild variant="outline" fullWidth>
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>
    </div>
  );
};
