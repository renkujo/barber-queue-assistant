"use client";

import { Toaster as SonnerToaster } from "sonner";

export const Toaster = () => (
  <SonnerToaster
    richColors
    position="top-center"
    toastOptions={{
      classNames: {
        toast: "bqa-toast",
        title: "bqa-toast-title",
        description: "bqa-toast-description",
        closeButton: "bqa-toast-close",
        actionButton: "bqa-toast-action",
        cancelButton: "bqa-toast-cancel",
      },
    }}
  />
);
