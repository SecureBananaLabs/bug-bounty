import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string()
});
