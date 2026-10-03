import { z } from "zod";

export const createMessageSchema = z.object({
  recipientId: z.string().trim().min(1),
  body: z.string().trim().min(1).max(5000)
});
