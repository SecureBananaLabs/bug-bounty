import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  message: z.string().trim().min(1, "message cannot be blank"),
  type: z.string().optional()
});
