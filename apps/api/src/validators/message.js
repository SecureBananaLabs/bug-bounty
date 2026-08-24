import { z } from "zod";

export const createMessageSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(5000),
  conversationId: z.string().min(1).optional()
});
