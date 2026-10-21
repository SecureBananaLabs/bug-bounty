import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1, "userId is required"),
  message: z.string().trim().min(1, "Notification 'message' cannot be empty").max(500, "Notification 'message' cannot exceed 500 characters"),
  type: z.string().trim().optional()
});
