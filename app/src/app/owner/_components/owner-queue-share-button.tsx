"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";

type ShareState = "idle" | "copied" | "shared" | "error";

type OwnerQueueShareButtonProps = {
  accessPin: string;
  publicToken: string;
  queueCode: string;
};

export const OwnerQueueShareButton = ({ accessPin, publicToken, queueCode }: OwnerQueueShareButtonProps) => {
  const [shareState, setShareState] = useState<ShareState>("idle");

  const shareQueue = async () => {
    const trackingUrl = new URL(`/queue/${publicToken}`, window.location.origin).toString();
    const shareText = `คิว ${queueCode}\nPIN เช็คคิว ${accessPin}`;

    try {
      await navigator.clipboard.writeText(`${shareText}\n${trackingUrl}`);
      setShareState("copied");
    } catch {
      if (!navigator.share) {
        setShareState("error");
        return;
      }

      try {
        await navigator.share({
          title: `คิว ${queueCode}`,
          text: shareText,
          url: trackingUrl,
        });
        setShareState("shared");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setShareState("error");
        }
      }
    }
  };

  const label = shareState === "copied"
    ? "คัดลอกแล้ว"
    : shareState === "shared"
      ? "แชร์แล้ว"
      : shareState === "error"
        ? "เปิดหน้าคิว"
        : "คัดลอกคิว";

  if (shareState === "error") {
    return (
      <Button asChild variant="ghost" size="sm" className="bqa-owner-queue-share">
        <a href={`/queue/${publicToken}`} target="_blank" rel="noreferrer" aria-label={label} title={label}>
          <Icon icon="lucide:external-link" aria-hidden="true" />
          <span className="bqa-owner-queue-share-label">{label}</span>
        </a>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="bqa-owner-queue-share"
      onClick={shareQueue}
      aria-label={label}
      aria-live="polite"
      title={label}
    >
      <Icon icon={shareState === "copied" || shareState === "shared" ? "lucide:check" : "lucide:copy"} aria-hidden="true" />
      <span className="bqa-owner-queue-share-label">{label}</span>
    </Button>
  );
};
