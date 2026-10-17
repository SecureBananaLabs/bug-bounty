import { z } from "zod";

export const createMessageSchema = z.object({
  body: z.string().trim().min(1),
  senderId: z.string().min(1),
  receiverId: z.string().min(1)
});
