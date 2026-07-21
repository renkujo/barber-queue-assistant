import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { logoutOwner } from "../actions";
import { OwnerNavigation } from "./owner-navigation";

type OwnerShellProps = {
  children: ReactNode;
  visualVersion?: "legacy" | "v2";
};

export const OwnerShell = ({ children, visualVersion = "legacy" }: OwnerShellProps) => (
  <main
    className={cn("bqa-owner-board-shell", visualVersion === "v2" && "bqa-queue-workspace-v2")}
    data-owner-visual={visualVersion}
  >
    <OwnerNavigation logoutAction={logoutOwner} />
    <div className="bqa-owner-workspace">{children}</div>
  </main>
);
