import { z } from "zod";

export const createNotificationSchema = z.object({
  message: z.string().trim().min(1, "Message is required and cannot be blank")
}).passthrough();
