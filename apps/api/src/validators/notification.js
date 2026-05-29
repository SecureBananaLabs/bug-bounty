import { z } from "zod";

export const createNotificationSchema = z.object({
  message: z.string().min(1).max(500),
  type: z.enum(["info", "warning", "error"]).default("info"),
  userId: z.string().min(1),
});
