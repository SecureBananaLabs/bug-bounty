import { z } from "zod";

const trimmedNonEmptyString = z.string().trim().min(1);

export const createNotificationSchema = z.object({
  message: trimmedNonEmptyString,
  userId: trimmedNonEmptyString,
  type: z.string().trim().min(1).optional()
});
