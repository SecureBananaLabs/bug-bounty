import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1),
  message: z.string().trim().min(1)
}).passthrough();
