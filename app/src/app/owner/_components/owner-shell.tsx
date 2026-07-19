import { type ReactNode } from "react";
import { logoutOwner } from "../actions";
import { OwnerNavigation } from "./owner-navigation";

type OwnerShellProps = {
  children: ReactNode;
};

export const OwnerShell = ({ children }: OwnerShellProps) => (
  <main className="bqa-owner-board-shell">
    <OwnerNavigation logoutAction={logoutOwner} />
    <div className="bqa-owner-workspace">{children}</div>
  </main>
);
