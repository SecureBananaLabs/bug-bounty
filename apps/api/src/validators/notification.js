import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(["info", "warning", "success", "alert"]).default("info")
});
