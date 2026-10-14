import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  type: z.string().min(1, "type is required"),
  message: z.string().min(1, "message is required")
});
