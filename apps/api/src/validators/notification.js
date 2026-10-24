import { z } from "zod";

export const createNotificationSchema = z
  .object({
    userId: z.string().trim().min(1),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(4000)
  })
  .strict();
