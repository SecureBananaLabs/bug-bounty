import { z } from "zod";

export const createNotificationSchema = z.object({
  type: z.string().trim().min(1),
  message: z.string().trim().min(1),
  recipientId: z.string().trim().min(1)
}).passthrough();
