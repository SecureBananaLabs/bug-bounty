import { z } from "zod";

export const createNotificationSchema = z
  .object({
    userId: z.string().trim().min(1, "userId is required").max(128),
    type: z.string().trim().min(1, "type is required").max(50),
    message: z.string().trim().min(1, "message cannot be empty").max(1000, "message exceeds 1000 characters"),
    link: z.string().trim().min(1).max(500).optional()
  })
  .strict();
