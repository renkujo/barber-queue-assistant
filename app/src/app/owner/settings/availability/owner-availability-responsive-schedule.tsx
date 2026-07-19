"use client";

import { type ReactNode, useEffect, useRef } from "react";

type OwnerAvailabilityResponsiveScheduleProps = {
  children: ReactNode;
};

export const OwnerAvailabilityResponsiveSchedule = ({ children }: OwnerAvailabilityResponsiveScheduleProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 760px)");

    const syncDisclosureState = () => {
      const root = rootRef.current;

      if (!root) {
        return;
      }

      root.querySelectorAll<HTMLDetailsElement>(".bqa-owner-weekly-disclosure").forEach((details) => {
        if (mediaQuery.matches) {
          details.open = true;
          return;
        }

        details.open = details.classList.contains("bqa-owner-weekly-disclosure--default-open");
      });
    };

    syncDisclosureState();
    mediaQuery.addEventListener("change", syncDisclosureState);

    return () => mediaQuery.removeEventListener("change", syncDisclosureState);
  }, []);

  return (
    <div ref={rootRef} className="bqa-owner-weekly-schedule" aria-label="ตารางรับลูกค้าประจำสัปดาห์">
      {children}
    </div>
  );
};
