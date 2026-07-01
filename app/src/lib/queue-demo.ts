export type QueueStatus = "open" | "paused" | "full" | "closed";

export type QueueRow = {
  code: string;
  customerName: string;
  serviceName: string;
  timeLabel: string;
  statusLabel: string;
  note: string;
  tone?: "current" | "next" | "warning";
};

export const shopStatus = {
  shopName: "ร้านช่างหนึ่ง",
  status: "open" as QueueStatus,
  openLabel: "เปิด 09:00 - 19:00 น.",
  currentQueueCount: 5,
  estimatedWaitMinutes: 45,
  nextSlots: ["10:30", "13:00", "14:30"],
};

export const todayQueue: QueueRow[] = [
  {
    code: "A08",
    customerName: "คุณนนท์",
    serviceName: "ตัดผมชาย",
    timeLabel: "09:20",
    statusLabel: "กำลังตัด",
    note: "เริ่ม 09:20 ประมาณ 30 นาที",
    tone: "current",
  },
  {
    code: "A09",
    customerName: "คุณอินทร์",
    serviceName: "ตัดผมชาย",
    timeLabel: "รอ",
    statusLabel: "คิวถัดไป",
    note: "รอประมาณ 5 นาที",
    tone: "next",
  },
  {
    code: "A07",
    customerName: "คุณสมชาย",
    serviceName: "ตัดผมชาย",
    timeLabel: "09:00",
    statusLabel: "มาสาย",
    note: "เลยเวลานัด 10 นาที",
    tone: "warning",
  },
  {
    code: "A10",
    customerName: "คุณกรณ์",
    serviceName: "ตัดผมชาย",
    timeLabel: "รอ",
    statusLabel: "คิว 2",
    note: "walk-in",
  },
  {
    code: "A11",
    customerName: "คุณธีร์",
    serviceName: "ตัดผมชาย",
    timeLabel: "11:30",
    statusLabel: "รอเวลา",
    note: "จองเวลา ยังไม่ถึงร้าน",
  },
];

export const services = [
  { id: "haircut", name: "ตัดผมชาย", durationMinutes: 30, priceLabel: "250 บาท" },
  { id: "shave", name: "โกนหนวด", durationMinutes: 20, priceLabel: "150 บาท" },
  { id: "wash-cut", name: "ตัด + สระ", durationMinutes: 45, priceLabel: "350 บาท" },
];
