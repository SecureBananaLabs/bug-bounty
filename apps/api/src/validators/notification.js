import { z } from "zod";

export const createNotificationSchema = z
  .object({
    userId: z.string().min(1),
    title: z.string().trim().min(1),
    body: z.string().trim().min(1)
  })
  .strict();
