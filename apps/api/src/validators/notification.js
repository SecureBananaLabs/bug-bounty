import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1, "userId is required"),
  type: z.string().trim().min(1, "type is required").max(50, "type cannot exceed 50 characters"),
  title: z.string().trim().min(1, "title cannot be empty").max(200, "title cannot exceed 200 characters"),
  message: z.string().trim().min(1, "message cannot be empty").max(1000, "message cannot exceed 1000 characters")
});
