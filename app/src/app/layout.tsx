import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barber Queue Assistant",
  description: "Daily queue assistant for a one-owner barber shop.",
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
