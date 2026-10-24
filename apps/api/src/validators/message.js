import { z } from "zod";

export const createMessageSchema = z.object({
  recipientId: z.string().trim().min(1),
  content: z.string().trim().min(1)
});
