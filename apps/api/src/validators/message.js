import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  body: z.string().trim().min(1),
  isRead: z.boolean().default(false)
});
