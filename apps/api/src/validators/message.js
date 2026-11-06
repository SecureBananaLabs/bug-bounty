import { z } from "zod";

export const createMessageSchema = z.object({
  recipientId: z.string().min(1).max(64),
  content: z.string().min(1).max(2000)
});

export const updateMessageSchema = createMessageSchema.partial();
