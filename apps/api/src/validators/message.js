import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.string().min(1),
  senderId: z.string().min(1),
  receiverId: z.string().min(1)
});
