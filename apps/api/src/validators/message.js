import { z } from "zod";

export const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  recipientId: z.string().trim().min(1)
}).passthrough();
