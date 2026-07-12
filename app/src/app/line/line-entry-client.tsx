"use client";

import liff from "@line/liff";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Icon } from "@/components/ui";

type LineEntryClientProps = {
  liffId?: string;
  targetPath: "/book" | "/walk-in" | "/#queue-status";
};

const getTargetLabel = (targetPath: LineEntryClientProps["targetPath"]) => {
  if (targetPath === "/book") {
    return "จองเวลา";
  }

  if (targetPath === "/#queue-status") {
    return "เช็คคิว";
  }

  return "รับคิววันนี้";
};

const buildTargetUrl = (targetPath: LineEntryClientProps["targetPath"], lineUserId: string) => {
  if (targetPath === "/#queue-status") {
    return targetPath;
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

const LineLogo = () => (
  <svg fill="#00C300" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>LINE</title>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

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
