import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required").max(64, "User ID too long"),
  title: z.string().trim().min(1, "Title is required").max(120, "Title cannot exceed 120 characters"),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message cannot exceed 1000 characters"),
  type: z.enum(["info", "warning", "success", "error"]).default("info")
});
