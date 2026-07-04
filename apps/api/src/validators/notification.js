import { z } from "zod";

export const notificationSchema = z.object({
  userId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  message: z.string().trim().min(1)
}).passthrough();
