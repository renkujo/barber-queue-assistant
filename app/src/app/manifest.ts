import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "Barber Queue Assistant Owner",
  short_name: "Barber Queue",
  description: "Owner queue board for Barber Queue Assistant.",
  start_url: "/owner",
  scope: "/",
  display: "standalone",
  background_color: "#fff8ee",
  theme_color: "#4f3429",
  orientation: "portrait",
  lang: "th",
  categories: ["business", "productivity"],
  icons: [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
  shortcuts: [
    {
      name: "คิววันนี้",
      short_name: "คิววันนี้",
      description: "เปิด owner queue board",
      url: "/owner",
      icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
    {
      name: "เพิ่ม walk-in",
      short_name: "Walk-in",
      description: "เพิ่มคิว walk-in จากหน้า owner",
      url: "/owner/walk-in",
      icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
    {
      name: "ตั้งค่าร้าน",
      short_name: "ตั้งค่า",
      description: "เปิดหน้าตั้งค่าร้าน",
      url: "/owner/settings",
      icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
  ],
});

export default manifest;
