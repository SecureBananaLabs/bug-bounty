import { z } from "zod";

export const sendMessageSchema = z.object({
  recipientId: z.string(),
  body: z.string().min(1)
});
