import { z } from "zod";

export const createNotificationSchema = z.object({
  type: z.string().min(1),
  message: z.string().min(1),
  recipientId: z.string().min(1)
});
