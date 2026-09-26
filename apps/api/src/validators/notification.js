import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().trim().min(1, "Notification title is required"),
  message: z.string().trim().min(1, "Notification message is required").optional(),
})
.strict();
