import { z } from "zod";

export const messageSchema = z.object({
  senderId: z.string().trim().min(1),
  recipientId: z.string().trim().min(1),
  content: z.string().trim().min(1)
});
