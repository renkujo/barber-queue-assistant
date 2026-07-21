export const bookingErrorMessages = {
  invalid: "กรอกข้อมูลไม่ครบ ลองตรวจชื่อ บริการ วัน เวลา และรูปแบบเบอร์โทรอีกครั้ง",
  closed: "ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว ลองเช็คอีกครั้งภายหลัง",
  "slot-unavailable": "เวลานี้ถูกจองหรือถูกพักร้านแล้ว เลือกเวลาอื่นแล้วลองใหม่",
  "rate-limited": "มีการส่งคำขอหลายครั้งเกินไป กรุณารอประมาณ 10 นาทีแล้วลองใหม่",
  database: "ยังบันทึกคิวไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
} as const;

export type BookingActionError = keyof typeof bookingErrorMessages;

export type BookingActionState = {
  error: BookingActionError | null;
};

export const initialBookingActionState: BookingActionState = {
  error: null,
};
