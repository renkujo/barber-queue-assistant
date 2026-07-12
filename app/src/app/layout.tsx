import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Toaster } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Barber Queue Assistant",
    template: "%s · Barber Queue Assistant",
  },
  description: "Daily queue assistant for a one-owner barber shop.",
  applicationName: "Barber Queue Assistant",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Barber Queue",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#4f3429",
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="th" data-scroll-behavior="smooth">
    <body>
      {process.env.NODE_ENV === "development" ? (
        <Script
          src="//unpkg.com/react-grab/dist/index.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      ) : null}
      {children}
      <Toaster />
    </body>
  </html>
);

export default RootLayout;
