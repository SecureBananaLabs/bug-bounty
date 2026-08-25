import { z } from "zod";

export const notificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string()
});
