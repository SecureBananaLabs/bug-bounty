import { z } from "zod";

export const messageSchema = z.object({
  recipientId: z.string(),
  body: z.string().min(1)
});
