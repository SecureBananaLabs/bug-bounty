import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  type: z.enum(["info", "warning", "error", "success"]),
  message: z.string().min(1, "message is required").max(500),
});
