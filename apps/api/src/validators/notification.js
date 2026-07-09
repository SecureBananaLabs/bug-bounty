import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  message: z.string().min(1, "Message is required").max(500),
  type: z.string().min(1).default("info")
});

export const updateNotificationSchema = createNotificationSchema.partial();
