"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

type RouteToastType = "success" | "error" | "warning" | "info";

export type IRouteToastProps = {
  message?: string | null;
  title?: string;
  description?: string;
  type?: RouteToastType;
  toastKey?: string;
  clearKeys?: string[];
};

export const RouteToast = ({
  message,
  title,
  description,
  type = "info",
  toastKey,
  clearKeys = ["error", "status"],
}: IRouteToastProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shownToastKeyRef = useRef<string | null>(null);
  const clearKeySignature = useMemo(() => clearKeys.join("|"), [clearKeys]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const currentToastKey = toastKey ?? `${type}:${title ?? ""}:${message}`;

    if (shownToastKeyRef.current === currentToastKey) {
      return;
    }

    shownToastKeyRef.current = currentToastKey;

    toast[type](title ?? message, {
      description: title ? (description ?? message) : description,
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    let hasChanged = false;

    for (const key of clearKeys) {
      if (nextParams.has(key)) {
        nextParams.delete(key);
        hasChanged = true;
      }
    }

    if (!hasChanged) {
      return;
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [clearKeySignature, clearKeys, description, message, pathname, router, searchParams, title, toastKey, type]);

  return null;
};
