import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1),
  type: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(1000)
}).strict();
