import { z } from "zod";

export const createMessageSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1)
});
