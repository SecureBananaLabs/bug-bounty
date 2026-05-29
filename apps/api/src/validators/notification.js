import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(3),
  body: z.string().min(5),
  type: z.enum(["proposal", "message", "billing", "system"])
});
