import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().trim().min(1),
  recipientId: z.string().trim().min(1),
  content: z.string().trim().min(1).max(5000)
});
