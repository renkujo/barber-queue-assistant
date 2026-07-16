import { z } from "zod";

export const optionalPhoneSchema = z.preprocess((value) => {
  const phone = String(value ?? "").trim();

  return phone || undefined;
}, z.string().min(8).max(20).regex(/^[0-9+\-\s]+$/).optional());
