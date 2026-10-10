import { z } from "zod";

export const notificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["proposal", "message", "payment", "review", "system"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000)
});
