import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  userId: z.string().min(1).optional()
});
