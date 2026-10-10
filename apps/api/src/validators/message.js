import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().min(1),
  recipientId: z.string().min(1),
  content: z.string().refine((value) => value.trim().length > 0)
}).passthrough();
