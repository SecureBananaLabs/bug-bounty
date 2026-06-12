import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["message", "proposal", "job_update", "payment", "review", "system"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  link: z.string().url().optional()
});
