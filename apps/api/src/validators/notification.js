import { z } from "zod";

export const createNotificationSchema = z.object({
  message: z.string().trim().min(1),
}).passthrough();
