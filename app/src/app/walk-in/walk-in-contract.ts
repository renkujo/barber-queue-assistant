export const walkInErrorMessages = {
  invalid: "กรอกข้อมูลไม่ครบ ลองตรวจชื่อ บริการ และรูปแบบเบอร์โทรอีกครั้ง",
  closed: "ตอนนี้ยังรับบัตรคิวออนไลน์ไม่ได้ กรุณาตรวจสถานะร้านก่อนลองใหม่",
  "rate-limited": "มีการส่งคำขอหลายครั้งเกินไป กรุณารอประมาณ 10 นาทีแล้วลองใหม่",
  database: "ยังรับคิวไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
} as const;

export type WalkInActionError = keyof typeof walkInErrorMessages;

export type WalkInActionState = {
  error: WalkInActionError | null;
};

export const initialWalkInActionState: WalkInActionState = {
  error: null,
};
