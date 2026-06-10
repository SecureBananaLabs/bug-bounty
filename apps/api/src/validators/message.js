import { z } from "zod";

export const createMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  recipientId: z.string().min(1),
  senderId: z.string().min(1).optional()
});
