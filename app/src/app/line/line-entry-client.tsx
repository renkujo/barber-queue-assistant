"use client";

import liff from "@line/liff";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Icon, LineLogo } from "@/components/ui";
import type { LineEntryIdentityPurpose } from "@/lib/line/line-entry-identity";
import { storeLineEntryIdentityAction } from "./actions";

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

const getIdentityPurpose = (targetPath: LineEntryClientProps["targetPath"]): LineEntryIdentityPurpose => {
  if (targetPath === "/book") {
    return "book";
  }

  if (targetPath.startsWith("/line/owner")) {
    return "owner";
  }

  return "walk-in";
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
  const ownerTarget = targetPath.startsWith("/line/owner");
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

        if (targetPath !== "/#queue-status") {
          const idToken = liff.getIDToken();

          if (!idToken) {
            throw new Error("LINE ID token is unavailable.");
          }

          await storeLineEntryIdentityAction(idToken, getIdentityPurpose(targetPath));
        }

        if (active) {
          window.location.assign(targetPath);
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
      <section
        className={`bqa-line-entry-panel bqa-line-entry-panel--${state}`}
        aria-busy={state === "connecting"}
        aria-live={state === "error" ? "assertive" : "polite"}
        role={state === "error" ? "alert" : "status"}
      >
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
          <Link href={ownerTarget ? "/owner/settings" : targetPath}>{ownerTarget ? "กลับหน้าตั้งค่า" : `ไปต่อ: ${targetLabel}`}</Link>
        </Button>
        <Button asChild variant="outline" fullWidth>
          <Link href={ownerTarget ? "/owner" : "/"}>{ownerTarget ? "กลับคิววันนี้" : "กลับหน้าแรก"}</Link>
        </Button>
      </div>
    </div>
  );
};
