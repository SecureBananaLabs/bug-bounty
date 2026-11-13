import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(1000),
  type: z.enum(["info", "warning", "success", "error"]).default("info")
});

export const updateNotificationSchema = createNotificationSchema.partial();
